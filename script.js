const urls = [
    'attribute.json',
    'specialization.json',
    'skill.json',
    'class.json',
    'perk.json',
];

// Global list of rulesets
var rulesets = [];

// Global ID to Identifiable lookup table
var IDLookup = {};

// Base database classes
class Identifiable {
    constructor(data) {
        this.data = data;
        
        // Validate ID
        var IDstr = String(this.ID).trim().toUpperCase();
        if( IDstr.length < 3 ) {
            throw new Error("IDs cannot be shorter than 3 characters");
        }
        if( IDstr != this.ID ) {
            throw new Error("Invalid ID '"+this.Name+"'");
        }
        if (this.ID in IDLookup) {
            throw new Error("Duplicate ID '%s' found", IDstr);
        }
        IDLookup[this.ID] = this;

        // Validate Ruleset
        var Rulesetstr = String(this.Ruleset).trim();
        if( Rulesetstr.length < 3 ) {
            throw new Error("Ruleset names can't be shorter than 4 for "+this.ID);
        }
        if( Rulesetstr != this.Ruleset ) {
            throw new Error("Extra whitespace in Ruleset name for "+this.ID);
        }
        if( ! rulesets.includes(this.Ruleset) ) {
            rulesets.push(this.Ruleset);
        }
    }
    get ID() { return this.data.ID; }
    get Name() { return this.data.Name; }
    get Ruleset() { return this.data.Ruleset; }
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
function constructAttributeHTML() {
    for (var i=0; i<attributes.length; ++i) {
        var atr = attributes[i];
        var html = '<div class="attribute-instance"><h3>';
        html += atr.Name;
        html += '</h3><input type="number" id="'+atr.ID+'" min="0" max="30" /></div>' ;
        $('#attributes-container').append(html);
    }
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
function constructSpecializationHTML() {
    for (var i=0; i<specializations.length; ++i) {
        var spe = specializations[i];
        var html = '<option value="'+spe.ID+'">'+spe.Name+'</option>';
        $('#specialization-selector').append(html);
    }
}

// Skills
var skills = [];
var skillsTree = {}; // {ATR_ID:{GROUPNAME:[skill,skill]}
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
    get Specialization() { return this.data.specialization; }
    get GroupName() { return this.data.GroupName; }
}
function parseSkills(data) {
    Object.keys(data).forEach(function(key){
        var item = data[key];
        var skill = new Skill(item);
        skills.push(skill);

        // Create skills tree
        if( ! (skill.Attribute.ID in skillsTree)) {
            skillsTree[skill.Attribute.ID] = {};
        }
        skillgroups = skillsTree[skill.Attribute.ID];
        if( ! (skill.GroupName in skillgroups)) {
            skillgroups[skill.GroupName] = [];
        }
        skillgroups[skill.GroupName].push(skill);
    });
    console.log("Parsed %d skills", skills.length);
}
function constructSkillHTML() {
    html = "";
    for (const[attr, grpdict] of Object.entries(skillsTree)) {
        html += '<div class="skill-attribute-group">';
        html += '<h2>' + IDLookup[attr].Name + '</h2>';
        for (const[grpname, grparr] of Object.entries(grpdict)) {
            html += '<div class="skill-sub-group">';
            html += '<h3>' + grpname + '</h3>';
            for(let i=0; i<grparr.length; ++i) {
                let skl = grparr[i];
                html += '<div class="skill-item"><h4>'+skl.Name+'</h4>'
                html += '<input type="number" id="'+skl.ID+'" min="0" max="30"/></div>'
                
            }
            html += '</div>';
        }
        html += '</div>';
    }
    $('#skills-container').append(html);
}

// Classes
var classes = [];
class Class extends Describable {
    constructor(data) {
        super(data);
        console.log("Added Class %s", this.Name);
    }
    get FlavorText() { return this.data["Flavor text"]; }
}
function parseClasses(data) {
    Object.keys(data).forEach(function(key){
        var item = data[key];
        var cls = new Class(item);
        classes.push(cls);
    });
    console.log("Parsed %d classes", classes.length);
}


class PerkRequirement {
    constructor(text) {

    }
}

var perks = [];
class Perk extends Describable {
    constructor(data) {
        super(data);
    }
}

function parsePerks(data) {
    Object.keys(data).forEach(function(key){
        var item = data[key];
        var perk = new Perk(item);
        perks.push(perk);
    });
    console.log("Parsed %d perks", perks.length);
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
        parseClasses(JSON.parse(data[3]));
        parsePerks(JSON.parse(data[4]));

        // Build HTML elements
        constructAttributeHTML();
        constructSpecializationHTML();
        constructSkillHTML();
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
});