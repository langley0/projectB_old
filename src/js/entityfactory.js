import Types from '../share/gametypes';
import Prop from './prop';
import Chest from './chest';
import Character from './character';

class EntityFactory {
    static builders = [];
    static createEntity(kind, id, name) {
        if(!kind) {
          
            return;
        }
    
        if(!_.isFunction(EntityFactory.builders[kind])) {
            throw Error(kind + " is not a valid Entity type");
        }
        return EntityFactory.builders[kind](id, name);
    };
}

EntityFactory.builders[Types.Entities.DEATHKNIGHT] = function(id) {
    const entity = new Character(id, Types.Entities.DEATHKNIGHT);
    return entity;
};

EntityFactory.builders[Types.Entities.CHEST] = function(id) {
    return new Chest(id);
};

EntityFactory.builders[Types.Entities.FIRE] = function(id) {
    const prop= new Prop(id, Types.Entities.FIRE);
    prop.attachPointLight(0xffc0a0, 1);
    return prop;
};

export default EntityFactory;