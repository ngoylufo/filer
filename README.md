# Filer

Filer is a simple file reader/writer for node.

## Installation

If you happened to have stumbled upon this and have some time to kill, installing filer isn't too complicated. Also I couldn't think of a different name.

```sh
npm install @ngoylufo/filer
```

## Usage

Filer only has two use cases, reading and writing to files. If want to order pizza whilst on the toilet, you've come to the wrong place.

### Require filer, preferably, at the top of your file

```js
const filer = require('@ngoylufo/filer');
```

Now you can read and write files.

```js
const package = filer.readFileSync({ filename: `${__dirname}/package.json` });
console.log(package); // <Buffer ...>

filer
  .readFile({
    filename: `${__dirname}/app/index.html`
  })
  .then(text => {
    console.log(text); // <Buffer ...>
  })
  .catch(err => {
    console.log('Something went wrong');
  });

// Returns a <Buffer >.
filer.readFileSync('sample.py');
```

### [Optional] Register some formats for default behaviour

```js
// How to deal with .json files.
filer.formats.register({
  extension: '.json',
  attributes: {
    reader: {
      options: { encoding: 'utf8' }
      coerce: buffer => JSON.parse(buffer.toString())
    },
    writer: {
      coerce: data => typeof data === 'string' ? data : JSON.stringify(data)
    }
  }
});

// Multiple formats following the same rules.
filer.formats.register({
  extension: ['.html', '.css', '.txt'],
  attributes: {
    reader: { options: { encoding: 'utf8' } },
    writer: { options: { encoding: 'utf8' } },
  }
});

const package = filer.readFileSync({ filename: `${__dirname}/package.json` });
console.log(package.name); // @ngoylufo/filer

filer.writeFile({
  filename: `${__dirname}/index.html`,
  data: '<!doctype html>'
}).then(() => {
  console.log('Wrote to file, now reading from file...');
  filer
    .readFile({ filename: `${__dirname}/index.html` })
    .then(data => {
      console.log(data); // <!doctype html>
    }).catch((contents) => {
      // contents === undefined not an error. At least not yet.
      console.log('Something went wrong!');
    });
});

// Unregistered format, returns a <Buffer ...>, if file exists.
filer.readFileSync('sample.py');
```

## API

Coming soon...

## License

This project is under the MIT License - see the [LICENSE](LICENSE) details.
