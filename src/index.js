#!/usr/bin/env node

const inquirer = require('inquirer');
const figlet = require('figlet');
const fs = require('fs');
const Image = require('ascii-art-image');
const color = require('chalk');
const extractFrames = require('ffmpeg-extract-frames');
const events = require('events');
const Events = new events();
const { Animation } = require("termination");
let dir = './frames';
let file;
let name;
let frames;

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
};

Events.on('print', ({ data: data }) => {
  if (!data || data.completed >= data.len) {
    frames = fs.readdirSync(`${dir}/${name}/ascii/`);
    const imgs = [];
    const transition = [];
    for (let i = 0; i < frames.length; i++) {
      const obj = fs.readFileSync(`${dir}/${name}/ascii/${frames[i]}`, 'utf8');
      imgs.push(obj);
      transition.push({
        props: {
          content: `${imgs[i]}`
        },
        duration: 40
      });
    };
    const animation = new Animation({
      fps: 30,
      maxSize: {
        height: 640,
        width: 640
      }
    });
    let animationImg = animation.add({
      x: 0,
      y: 0,
      content: imgs[0],
      replaceSpace: true
    }); console.log(transition.length);
    const animationImgTransition = animationImg.transition(transition, {
      loop: true,
      alternate: true
    });
    animation.start();
    animationImgTransition.run();
  };
});

console.log(color.cyan(figlet.textSync('Animation_Terminal')));

inquirer.prompt([
  {
    name: 'dir',
    message: 'Nome do vídeo:',
    validate(answer) {
      file = fs.readdirSync('./').filter(file => file.endsWith('.gif') || file.endsWith('.mp4'));
      if (!file || !file[0]) {
        console.log(color.red('\n[ERROR] Não consegui encontrar vídeos'));
        process.exit();
      }
      file = file.filter(x => x.toLowerCase().includes(answer.trim().toLowerCase()))[0];
      if (answer.length < 1) {
          return 'Digite um vídeo valido.';
      };
      if (file) {
        return true
      } else {
        return 'Digite um vídeo valido.';
      };
    }
  }
]).then(async () => {

  name = file.split('.mp4').join('').split('.gif').join('');

  if (!fs.existsSync(`${dir}/${name}`)) {

    fs.mkdirSync(`${dir}/${name}`);
    fs.mkdirSync(`${dir}/${name}/ascii/`);
    await extractFrames({
      input: `${file}`,
      output: `${dir}/${name}/frame-%d.png`,
      width: 640 / 2,
      height: 480 / 2
    });

    frames = fs.readdirSync(`${dir}/${name}`).filter(file => file.endsWith('.png'));

    if (!frames[0]) {
      console.log(color.red('\n[ERROR] Não consegui encontrar os frames.'));
      process.exit();
    };

    const data = {};

    data.len = frames.length;
    data.completed = 0;
  
    for (let i = 0; i < data.len; i++) {
      var image = new Image({
        filepath: `${dir}/${name}/${frames[i]}`,
        alphabet: 'greyscale'
      });
      image.write((err, rendered) => {
        fs.writeFile(`${dir}/${name}/ascii/${i+1}.txt`, `${rendered}`, (err) => {
          if (err) {
            console.log(color.red('\n[ERROR] Não consegui criar os frames.'));
            process.exit();
          } else {
            data.completed += 1;
            Events.emit('print', ({ data: data }));
          };
        });
      });
    };

  } else {
    Events.emit('print', ({ data: undefined }));
  };

});