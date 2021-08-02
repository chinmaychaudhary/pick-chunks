# Pick Chunks

## Installation

```bash
yarn add -D @devxm/pick-chunks
```

## Usage

### Command Line

The pick chunks is launched from terminal after installation.

```bash
yarn devxm-pick-chunks <options>
```

Options supported includes

- `-r, --root <root>`: path to source directory of project (default: "./")
- `-c, --config <config>`: path to configuration (default: "pick-chunks.config.js")
- `-p, --port <port> ` : port to run interface on (default: 3000)
- `-h, --help`: display help for command

### Configuration

The pick chunks depends on `pick-chunks.config.js` to manage the collections and commandline args. The format of the file is as follows:

```js
module.exports = {
    root: './',
    port: '3000',
    collections: [
        {
            name: 'name of collection',
            description: 'brief about collection',
            chunks: ['chunk-one.js', 'folder/chunk-two.js']
        },
        // More collections in similar fashion
        ...
    ]
}
```

The chunks will contain array of file paths relative to `root` of the project.

### GUI

The GUI of pick chunks is where all operations are done. This will launch at `localhost:<port>` automatically once launched.
