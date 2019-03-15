import Types from '../share/gametypes';
import Prop from "./prop";

export default class Chest extends Prop {
    constructor(id) { 
        super(id, Types.Entities.CHEST);
    }
}