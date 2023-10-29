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

// Global functions
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

// Parsing regexps
//numericReq = /^.+\d+\+$/;

// Simple numeric req
const simpleNumeric = /^ *(?<token>[\w ąćęłńóśźż.]*) (?<value>\d+)\+ *$/;
const stripSpaces = /^ *(?<token>[\w ąćęłńóśźż.]*) *$/;

const OPR_IS = Symbol("IS");
const OPR_GOR = Symbol(">=");

const RequirementType = {
    CECHA_STARTOWA:Symbol("cecha startowa"),
    POCHODZENIE:Symbol("pochodzenie"),
    PROFESJA:Symbol("profesja"),
    ATRYBUT:Symbol("atrybut"),
    UMIEJETNOSC:Symbol("umiejetnosc"),
    BRAK:Symbol("brak")
}

class PerkRequirementAtom {
    constructor(text) {
        // Strip potential :
        text = text.replace(":", "");
        this.type = RequirementType.BRAK;
        this.required = null;
        this.value = -1;
        // Attempt to parse as numeric field, ie "pistolety 3+"
        let result = simpleNumeric.exec(text);
        if ( result !== null ) {
            let token = result.groups.token;
            this.value = result.groups.value;
            this.parseToken(token);
           //console.log(`Token ${token}: ${value}`);
        } else {
            // Strip trailing and leading spaces
            result = stripSpaces.exec(text);
            if( result !== null ) {
                let token = result.groups.token;
                // It could be an attribute or skill that's missing a number (using number of last atomic req)
                

                for( const rqt in RequirementType ) {
                    let type = RequirementType[rqt];
                    if ( token.startsWith(type.description) ) {
                        return;
                    }
                }
            } else {
                console.log(`Failed to parse ${text}`)
            }
        }
    }

    parseToken(token) {
        for (var i=0; i<attributes.length; ++i) {
            var atr = attributes[i];
            if( token == atr.Name.toLowerCase() ) {
                this.type = RequirementType.ATRYBUT;
                this.required = atr;
                return;
            }
        }
        for (var i=0; i<skills.length; ++i) {
            var skl = skills[i];
            if( token == skl.Name.toLowerCase() ) {
                this.type = RequirementType.UMIEJETNOSC;
                this.required = skl;
                return;
            }
        }
        console.log(`Cannot parse token ${token}`);
    }
}

// Perk requirements are all ANDed
// Are composed or 1 or more ORed perk requirement atoms
// ie. PerkRequirement: Mechanika lub Chirurgia 4+ -> Mechanika 4+ Atom OR Chirurgia 4+ Atom
// PerkRequirement: Mechanika 4+ -> Mechaika 4+ Atom
// A single 
class PerkRequirement {
    constructor(text) {
        text = text.toLowerCase();
        text = text.replace("albo", "lub");

        let atomstxt = text.split("lub");
        atomstxt.reverse();
        this.atoms = [];
        for( const atomtxt of atomstxt ) {
            let atom = new PerkRequirementAtom(atomtxt)
            this.atoms.push(atom);
        }
    }
}






var perks = [];
class Perk extends Describable {
    constructor(data) {
        super(data);
        this.RequirementsText = data.Requirements;
        let reqtext = this.data.Requirements.split(",");
        this.requirements = []
        for( const req of reqtext) {
            let requirement = new PerkRequirement(req);
            this.requirements.push(requirement);
        }
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

// Character 

const MALE = Symbol("Mężczyzna");
const FEMALE = Symbol("Kobieta");

class Character {
    constructor() {
        this.attributes = {};
        for (const attribute of attributes) {
           this.attributes[attribute.ID] = 0;
        };
        this.skills = {};
        for (const skill of skills) {
            this.skills[skill.ID] = 0;
        };
        this.specialization = specializations[0];
        this.gender = MALE;
    }

    randomize() {
        const that = this;
        // Attributes
        Object.keys(this.attributes).forEach(function(key){
            that.attributes[key] = getRandomInt(6, 18);
        });

        // Skills
        Object.keys(this.skills).forEach(function(key){
            that.skills[key] = getRandomInt(0, 6);
        });
    }
}

function loadChar(char) {
    merged = Object.assign({}, char.attributes, char.skills );
    Object.keys(merged).forEach(function(key){
        $('#'+key).val(merged[key]); 
    });
}

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
        var char = new Character();
        char.randomize();
        loadChar(char);

    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
});