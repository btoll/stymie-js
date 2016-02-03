### About

### Features

- No need to remember another password, `stymie` will use the default GPG key.
- Create any number of key fields beyond the default username and password.  For example:

```
username: 'derp',
password: '1234',
SSN: '123-45-6789',
securityAnswer: '1st Avenue'
```

- Create encrypted files as well as key entries.
- Since everything is stored in `.stymie_d/`, it's easy to port between systems.
- GPG end-to-end encryption allows `stymie` to be safely versioned.

### Security Features

- Uses GPG/PGP public-key cryptography to encrypt everything (even configs).
- Uses OS-level permissions-based access control so only the user can view and list any files created by the user.
- Cryptographically hashes the key name as the filename when creating encrypted files.
- Uses the [shred] utility to overwrite any removed file in-place (including a final pass of zeroes to hide the shredding) before unlinking.
- When using Vim to edit any files (the default), does not leave any swap or backup files during or after editing.
- Optionally, asks to set `$HISTIGNORE` so `stymie` commands aren't stored in history (See the `postinstall.bash` script for an [example in Bash](scripts/postinstall.bash.example))[1].

[1] As an alternative to setting `$HISTIGNORE`, most shells by default allow for any command preceded by a `[[SPACE]]` to be ignored by history. Check the value of `$HISTCONTROL` for support.

Only Linux and OS X are supported at this time. There are no plans to support Windows.

### Installation

`npm install git+https://github.com/btoll/stymie -g`

### Suggestions

- Use `gpg-agent` to save typing.
- Set `$EDITOR` environment variable to preferred editor. Place editor configs in the `editors/` directory. See the [example for Vim](editors/vim.json).

### Usage

    Command | Description
    ------------ | -------------
    add | Adds a new entry.
    edit | Edits an entry.
    generate | Generates a diceware passphrase.
    get | Retrieves an entry.
    has | Checks if the entry exists.
    init | Installs the password file directory and config file.
    list | List all entries.
    remove | Deletes an entry.

    Option | Description
    ------------ | -------------
    --field | Get specified key from an entry (only with `get` command).
    --file | Operate on files.
    -h, --help | Display help.

[shred]: https://en.wikipedia.org/wiki/Shred_(Unix)

