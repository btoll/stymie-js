### Another Password Manager

I was using a well-known cloud-based password manager for years. I was happy with it, but I always felt a bit apprehensive because of the whole cloud thing. The main reason I continued to use it was because of the convenient auto-fill form feature, but the nagging doubts persisted, not to mention that that's a lame excuse to continue using something that's as important as a password manager.

Finally, I had some down time and coded up **stymie**. While the convenience is sacrificed, I sleep better knowing exactly how my passwords are protected and where they are stored.

### Security Features

- Uses GPG/PGP public-key cryptography to encrypt all files, both entries and configs.
- Uses OS-level permissions-based access control so only the user can view and list the password files.
- Uses the [shred] utility to overwrite the password file in place (including a final pass of zeroes to hide the shredding) before unlinking.
- Does not leave any swap files or backups during or after editing (Vim).

### Installation

1. `npm install https://github.com/btoll/stymie.git -g` will install the package.
2. `bash scripts/postinstall.sh` will install the password files directory.

In addition, it's highly recommended to set/update `$HISTIGNORE` to ignore any **stymie** history commands in the shell. See the `postinstall.sh` script for an example in Bash.

As an alternative to setting `$HISTIGNORE`, most shells by default allow for any command preceded by a [[SPACE]] to be ignored by history. Check `$HISTCONTROL` to make sure.

*** Only Linux and OS X are supported at this time. There are no plans to support Windows.

### Suggestions

- Use `gpg-agent` to save typing!
- Set `$EDITOR` environment variable to preferred editor.


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
    -h, --help | Display help.

[shred]: https://en.wikipedia.org/wiki/Shred_(Unix)

