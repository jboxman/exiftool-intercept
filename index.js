const readline = require('node:readline');
const { spawn } = require('node:child_process');
const EOL = require('os').EOL;
const fs = require('node:fs');

// TODO -- includes no error handling of any kind

const exiftoolPath = process.env['EXIFTOOL_REAL_PATH']
  ? process.env['EXIFTOOL_REAL_PATH']
  : '/usr/local/bin/exiftool-real';
const logPath = process.env['EXIFTOOL_INTERCEPT_LOG']
  ? process.env['EXIFTOOL_INTERCEPT_LOG']
  : '/tmp/exiftool-intercept.log';

const logAndWriteTo =
  (handle = 'stdout') =>
  (s) => {
    fs.appendFileSync(logPath, `${s}`);
    process[handle].write(s);
  };

function main() {
  const args = process.argv.slice(2);
  fs.appendFileSync(logPath, `${args}\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: null,
  });

  const cancel = setTimeout(() => rl.close(), 100);

  const exiftool = spawn(exiftoolPath, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  exiftool.stdout.on('data', (s) => logAndWriteTo('stdout')(s));
  exiftool.stderr.on('data', (s) => logAndWriteTo('stderr')(s));

  if (args.includes('-stay_open')) {
    clearTimeout(cancel);
    exiftool.on('spawn', () => {
      rl.on('line', (cmd) => {
        fs.appendFileSync(logPath, `${cmd}\n`);
        exiftool.stdin.write(cmd);
        exiftool.stdin.write(EOL);
      });
    });
  }
}

module.exports = main;
