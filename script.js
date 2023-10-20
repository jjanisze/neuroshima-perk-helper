const urls = [
    'attribute.json',
    'specialization.json',
    'skill.json',
    'class.json',
    'perk.json',
];

// Global ID to Identifiable lookup table
var IDLookup = {};

// Base database classes
class Identifiable {
    constructor(data) {
        this.data = data;
        
        // Validate ID
        var IDstr = String(this.ID).trim().toUpperCase();
        if( IDstr != this.ID ) {
            throw new Error("Invalid ID '"+this.Name+"'");
        }
        if (this.ID in IDLookup) {
            throw new Error("Duplicate ID '%s' found", IDstr);
        }
        IDLookup[this.ID] = this;
    }
    get ID() { return this.data.ID; }
    get Name() { return this.data.Name; }
}

class Describable extends Identifiable {
    constructor(data) {
        super(data);
    }
    get Description() { return this.data.Description; }
}


// Attributes
var attributes = [];
class Attribute extends Describable {
    constructor(data) {
        super(data);
        console.log("Added Attribute %s", this.Name);
    }
    
}
function parseAttributes(data) {
    Object.keys(data).forEach(function(key){
        var item = data[key];
        var attribute = new Attribute(item);
        attributes.push(attribute);
    });
    console.log("Parsed %d attributes", attributes.length);
}


// Specializations
var specializations = [];
class Specialization extends Describable {
    constructor(data) {
        super(data);
        console.log("Added Specialization %s", this.Name);
    }
}
function parseSpecializations(data) {
    Object.keys(data).forEach(function(key){
        var item = data[key];
        var specialization = new Specialization(item);
        specializations.push(specialization);
    });
    console.log("Parsed %d specializations", attributes.length);
}

// Skills
var skills = [];
class Skill extends Describable {
    constructor(data) {
        super(data);

        // Validate and cross-reference Attribute
        if( this.data.Attribute in IDLookup ) {
            var attr = IDLookup[this.data.Attribute];
            if( ! attr instanceof Attribute ) {
                throw Error("For Skill '"+this.Name+"', base Attribute ID '"+this.data.Attribute+"' is not an Attribute");
            } else {
                this.attribute = attr;
            }
        } else {
            throw Error("Cannot find ID '"+this.data.Attribute+"'");
        }

        // Validate and cross-reference Specialization
        if( this.data.Specialization in IDLookup ) {
            var spec = IDLookup[this.data.Specialization];
            if( ! spec instanceof Specialization ) {
                throw Error("For Skill '"+this.Name+"', Specialization ID '"+this.data.Specialization+"' is not a Specialization");
            } else {
                this.specialization = spec;
            }
        }
        console.log("Added Skill %s", this.Name);
    }
    get Attribute() { return this.attribute; }
    get Specialization() { return this.specialization; }
}
function parseSkills(data) {
    Object.keys(data).forEach(function(key){
        var item = data[key];
        var skill = new Skill(item);
        skills.push(skill);
    });
    console.log("Parsed %d skills", skills.length);
}

class PerkRequirement {
    constructor(text) {

    }
}

class Perk {
    constructor(name) {}
}

/*
$(document).ready(function() {
    console.log("A");
    fetch("perks.json").then(response => response.json()).then(data => {
        //$("#test").text(data.PERK_ARAMIS.Name);
        Object.keys(data).forEach(function(key){
            var item = data[key]
            console.log(item.Name);
        });
    });
    console.log("B");
    
});

*/

const promises = urls.map(url => fetch(url));

$(document).ready(function() {
    Promise.all(promises).then(responses => {
        // Process the responses here
        return Promise.all(responses.map(response => response.text()));
    }).then(data => {
        // data contains the content of all fetched files
        parseAttributes(JSON.parse(data[0]));
        parseSpecializations(JSON.parse(data[1]));
        parseSkills(JSON.parse(data[2]));
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
});