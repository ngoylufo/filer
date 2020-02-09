# Filer

Filer is a simple file reader/writer for node.

## Installation

If you happened to have stumbled upon this and have some time to kill, installing filer isn't too complicated. Also I couldn't think of a different name.

```sh
npm install @ngoylufo/filer
```

## Usage

Filer only has two use cases, reading and writing to files. If want to order pizza whilst on the toilet, you've come to the wrong place.

### Require filer, preferably, at the top of your file.

```js
const filer = require('@ngoylufo/filer');
```

Now you can read and write files.

```js
const package = filer.readFileSync('package.json');
console.log(package); // <Buffer ...>

filer
  .readFile(`${__dirname}/app/index.html`)
  .then(text => {
    console.log(text); // <Buffer ...>
  })
  .catch(err => {
    console.log('Something went wrong');
  });

// Returns a <Buffer >.
filer.readFileSync('sample.py');
```

### [Optional] Register some formats for default behaviour.

```js
filer.formats.register('.json', {
  reader: {
    options: { encoding: 'utf-8' }
    coerce: buffer => JSON.parse(buffer.toString())
  },
  writer: {
    coerce: data => typeof data === 'string' ? data : JSON.stringify(data)
  }
});

// Multiple formats following the same rules.
filer.formats.register(['.txt', '.html', '.css'], {
  reader: {
    options: { encoding: 'utf-8' },
  },
  writer: {
    options: { flag: 'w+' }
  }
});

const package = filer.readFileSync('package.json');
console.log(package.name); // @ngoylufo/filer

filer.readFile(`${__dirname}/app/index.html`).then(text => {
  console.log(text); // <!doctype html>...
}).catch(err => {
  console.log('Something went wrong');
});

// Returns a <Buffer ...>.
filer.readFileSync('sample.py');
```

## API

Coming soon...

## License

This project is under the MIT License - see the [LICENSE](LICENSE) details.
