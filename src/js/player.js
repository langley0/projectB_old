import Character from './character';

export default class Player extends Character{

    constructor(id, name, kind) {
        super(id, kind);

        this.name = name;
    }
}