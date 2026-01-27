# @envsync-labs/cli

E2E encrypted secrets management CLI for EnvSync.

## Installation

```bash
npm install -g @envsync-labs/cli
```

## Quick Start

```bash
# Login to your EnvSync account
envsync login

# Initialize a project
envsync init

# Push environment variables
envsync push

# Pull environment variables
envsync pull
```

## Commands

| Command                  | Description              |
| ------------------------ | ------------------------ |
| `envsync login`          | Authenticate via browser |
| `envsync logout`         | Clear local credentials  |
| `envsync whoami`         | Show current user        |
| `envsync init`           | Initialize project       |
| `envsync push`           | Upload env variables     |
| `envsync pull`           | Download env variables   |
| `envsync add <email>`    | Add team member          |
| `envsync remove <email>` | Remove team member       |
| `envsync grant <email>`  | Grant crypto access      |
| `envsync status`         | Show sync status         |

## Documentation

Visit [envsync.tech](https://envsync.tech) for full documentation.

## License

MIT
