# Stymie

[![Build Status](https://travis-ci.org/btoll/stymie.svg?branch=master)](https://travis-ci.org/btoll/stymie)

## Features

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
- Generate passwords using [Diceware], [Sillypass] or enter a custom password.

## Security Features

- Uses GPG/PGP public-key cryptography to encrypt everything (even configs).
- Uses OS-level permissions-based access control so only the user can view and list any files created by the user.
- Cryptographically hashes the key name as the filename when creating encrypted files.
- Uses the [shred] utility to overwrite any removed file in-place (including a final pass of zeroes to hide the shredding) before unlinking. Will default to `rm` when `shred` isn't installed.
- When using Vim to edit any files (the default), does not leave any swap or backup files during or after editing.
- Optionally, asks to set `$HISTIGNORE` so `stymie` commands aren't stored in history (See the `postinstall.bash` script for an [example in Bash](scripts/postinstall.bash.example))[1].

[1] As an alternative to setting `$HISTIGNORE`, most shells by default allow for any command preceded by a `[[SPACE]]` to be ignored by history. Check the value of `$HISTCONTROL` for support.

Only Linux and OS X are supported at this time. There are no plans to support Windows.

## Installation

`npm install git+https://github.com/btoll/stymie -g`

## Suggestions

- Use `gpg-agent` to save typing.
- Set `$EDITOR` environment variable to preferred editor. Place editor configs in the `editors/` directory. See the [example for Vim](editors/vim.json).

## Examples

- Create the `example.com` key:
```
stymie add example.com
```

- Add an encrypted file with the key name `secrets`:
```
stymie add-file secrets
```

- Edit the `example.com` key:
```
stymie edit example.com
```

- Delete the file with the key name `secrets`:
```
stymie rm-file secrets
```

- Get just the `username` field value from the `example.com` key:
```
stymie get example.com --field username
```

- Get just the `password` field value from the `example.com` key and copy it to the system clipboard (OS X):
```
stymie get example.com --field password | pbcopy
```

## Usage

### Commands that operate on password manager entries

    Command | Description
    ------- | --------
    add | Adds a new entry
    edit | Edits an entry
    get | Retrieves an entry
    has | Checks if the entry exists
    list | List all entries
    rm | Deletes an entry

### Commands that operate on files

    Command | Description
    ------- | --------
    add-file | Adds a new file or directory
    edit-file | Edits a file
    get-file | Retrieves a file
    has-file | Checks if the file exists
    list-file | List all files (TODO)
    rm-file | Deletes a file

### Other commands and options

    Command | Description
    ------- | --------
    generate | Generates a diceware passphrase
    init | Installs the password file directory and config file

    Option | Description
    ------- | --------
    --field, -f | Gets the specified key value from an entry (only with `get` command).
    --strip, -s | Strips any whitespace from a field (only with `get` command).
    -h, --help | Display help.

## License

[MIT](LICENSE)

## Author

Benjamin Toll

[Diceware]: https://github.com/btoll/diceware
[Sillypass]: https://github.com/btoll/sillypass
[shred]: https://en.wikipedia.org/wiki/Shred_(Unix)

