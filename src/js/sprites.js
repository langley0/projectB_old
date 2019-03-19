const sprites = [];
const names = [
    "deathknight",
    "clotharmor",
];


for (const name of names) {
    const data = require(`../assets/${name}.json`);
     sprites.push(data);
    
}

export default sprites;
