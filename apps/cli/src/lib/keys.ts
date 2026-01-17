import ora from "ora";
import chalk from "chalk";
import inquirer from "inquirer";
import { configManager } from "./config.js";
import {
  generateKeyPair,
  generateRecoveryKey,
  encryptWithRecoveryKey,
  decryptWithRecoveryKey,
  BackupPayload,
} from "./crypto.js";
import * as api from "./api.js";

/**
 * Ensures the user has RSA keys for E2E encryption.
 * - If both keys exist locally: skip
 * - If only public key missing: fetch from server
 * - If private key missing: recover from backup
 * - If new user: generate keys + recovery key + backup
 */
export async function ensureUserKeys(): Promise<void> {
  const hasPrivateKey = !!configManager.getPrivateKey();
  const hasPublicKey = !!configManager.getPublicKey();

  // Case 1: Both keys exist locally
  if (hasPrivateKey && hasPublicKey) {
    return;
  }

  console.log("");
  const spinner = ora("Checking identity...").start();

  try {
    // Case 2: Only public key missing (fetch from server)
    if (hasPrivateKey && !hasPublicKey) {
      const { publicKey } = await api.getMyPublicKey();
      if (publicKey) {
        configManager.setKeyPair({
          publicKey,
          privateKey: configManager.getPrivateKey()!,
        });
        spinner.succeed("Identity restored.");
        return;
      }
    }

    // Case 3: Private key missing - check for remote backup
    let remoteBackup: BackupPayload | null = null;
    try {
      remoteBackup = await api.downloadBackup();
    } catch (e: any) {
      if (e.response?.status !== 404) throw e;
    }

    spinner.stop();

    // Case 3a: Recover from backup
    if (remoteBackup) {
      console.log("Found identity backup. Recovery required.");

      const { recoveryKey } = await inquirer.prompt([
        {
          type: "input",
          name: "recoveryKey",
          message: "Enter your Recovery Key (RK-XXXX...):",
          validate: (input) =>
            input.trim().length > 20 || "Recovery key looks too short",
        },
      ]);

      const decryptSpinner = ora("Unlocking...").start();
      try {
        // Normalize: uppercase for case-insensitive matching
        const normalizedKey = recoveryKey.trim().toUpperCase();

        const privateKey = decryptWithRecoveryKey(remoteBackup, normalizedKey);
        const { publicKey } = await api.getMyPublicKey();

        if (!publicKey) {
          throw new Error("Public key not found on server");
        }

        configManager.setKeyPair({ publicKey, privateKey });
        decryptSpinner.succeed("Identity recovered.");
        return;
      } catch {
        decryptSpinner.fail("Invalid recovery key.");
        process.exit(1);
      }
    }

    // Case 4: New user - fresh setup with auto-generated recovery key
    console.log("No identity found. Setting up...\n");

    // Step 1: Generate RSA keys
    const genSpinner = ora("Generating RSA keys...").start();
    const keys = generateKeyPair();
    genSpinner.succeed("Keys generated.");

    // Step 2: Upload public key
    const uploadSpinner = ora("Registering identity...").start();
    await api.uploadPublicKey(keys.publicKey);
    uploadSpinner.succeed("Identity registered.");

    // Step 3: Generate recovery key
    const recoveryKey = generateRecoveryKey();

    // Step 4: Encrypt and upload backup
    const backupSpinner = ora("Creating backup...").start();
    const backupPayload = encryptWithRecoveryKey(keys.privateKey, recoveryKey);
    await api.uploadBackup(backupPayload);
    backupSpinner.succeed("Backup created.");

    // Step 5: Save keys locally
    configManager.setKeyPair(keys);

    // Step 6: Display recovery key to user
    console.log("");
    console.log(chalk.bold.yellow("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
    console.log(chalk.bold.yellow("         SAVE YOUR RECOVERY KEY          "));
    console.log(chalk.bold.yellow("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
    console.log("");
    console.log(chalk.bold.cyan(`  ${recoveryKey}`));
    console.log("");
    console.log(chalk.gray("  This is the ONLY way to recover your account"));
    console.log(chalk.gray("  if you lose access to this device."));
    console.log(chalk.gray("  Store it somewhere safe!"));
    console.log("");
    console.log(chalk.bold.yellow("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
    console.log("");

    // Wait for user to acknowledge
    await inquirer.prompt([
      {
        type: "confirm",
        name: "saved",
        message: "I have saved my Recovery Key",
        default: false,
      },
    ]);
  } catch (error: any) {
    spinner.fail("Identity setup failed.");
    console.error(error.message);
    process.exit(1);
  }
}
