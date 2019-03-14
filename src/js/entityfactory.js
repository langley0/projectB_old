

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

export default EntityFactory;