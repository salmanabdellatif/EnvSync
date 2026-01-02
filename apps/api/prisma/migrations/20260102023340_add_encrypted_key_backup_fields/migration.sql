-- AlterTable
ALTER TABLE "User" ADD COLUMN     "encryptedPrivateKey" TEXT,
ADD COLUMN     "encryptionAuthTag" TEXT,
ADD COLUMN     "encryptionIV" TEXT,
ADD COLUMN     "encryptionSalt" TEXT;
