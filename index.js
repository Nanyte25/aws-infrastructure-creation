var argv = require('minimist')(process.argv.slice(2));
var _ = require("underscore");
var ConfParser = require('./lib/configParser');
var InfBuilder = require('./lib/infrastructureBuilder');
var SiteBuilder = require('./lib/siteBuilder');
var AWS = require('aws-sdk');

var ec2 = {};
if(! argv.o || ! argv.p) {
  console.log("usage: node index.js -o <organisation name> -p <aws profile>");
  process.exit(1);
}

var confParser = ConfParser();
confParser.parse(argv.o);


var credentials = new AWS.SharedIniFileCredentials({profile: argv.p});
if(typeof credentials.accessKeyId == "undefined" ){
  console.log("Profile: '" + argv.p + "' does not exist.");
  process.exit();
}

AWS.config.credentials = credentials;
console.log("Setting region: ".yellow, confParser.parsedConfig.region.reference);
AWS.config.region = confParser.parsedConfig.region.reference;

ec2 = new AWS.EC2();

infBuilder = InfBuilder(confParser.parsedConfig, ec2);
console.log("\nCreating Infrastructure".yellow);
infBuilder.build(function(){
  console.log("Infrastructure creation completed.\n".yellow);
  _.each(confParser.parsedConfig.sites, function(siteConfig){
    siteBuilder = SiteBuilder(siteConfig, infBuilder.vpc, ec2);
    siteBuilder.build();
  });
});
