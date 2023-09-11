# Avatar desktop library

## Installation steps (yarn)

1. Tell yarn where to find packages starting with `@buffgame`. In your project's root directory, add the following contents to the `.yarnrc` file:

        "@buffgame:registry" "https://npm.pkg.github.com"
        always-auth true

2. Authorize yarn to download this package, because BUFF is a private GitHub organization.

    - First, generate a personal access token (PAT) for your GitHub account on [this link](https://github.com/settings/tokens). The required scope is `read:packages`.

    - Then run the following command using **npm**.

            npm config set //npm.pkg.github.com/:_authToken <PAT>

        **Important**: You cannot use `yarn config set` to set the token. 🤷

3. Verify that your token is set using `yarn config list`.

4. Install the package as usual:

        yarn add @buffgame/avatar.desktop-lib

## Installation steps (npm)

1. Tell npm where to find packages starting with `@buffgame`. In your project's root directory, add the following contents to the `.npmrc` file:

        "@buffgame:registry"="https://npm.pkg.github.com"
        always-auth=true

2. Authorize npm to download this package, because BUFF is a private GitHub organization.

    - First, generate a personal access token (PAT) for your GitHub account on [this link](https://github.com/settings/tokens). The required scope is `read:packages`.

    - Then run the following command.

            npm config set //npm.pkg.github.com/:_authToken <PAT>

3. Verify that your token is set using `npm config list`.

4. Install the package as usual:

        npm install @buffgame/avatar.desktop-lib

*Contact: pezacik@buff.game*


## How to use

### Hooks

The `useHighlights` and `useLibrary` hooks can be used to get live updates to the highlights and library page.

### Actions

- `uploadHighlight`, `uploadEditedHighlight`
- `downloadHighlight`
- `moveToLibrary`, `saveEditedHighlight`
- `deleteHighlight`, `deleteSession`
- `updateTitle`

You can call these functions from anywhere in your code (in buff.app) and you will automatically receive updates to the `useHighlights` and `useLibrary` hooks