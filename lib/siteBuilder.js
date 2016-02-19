var _ = require("underscore");
var AWS = require('aws-sdk');
var util = require('util');
var colors = require('colors');
var GRP = require('./groups.js');

module.exports = function(config, vpc, ec2){

  return {
    config: config,
    ec2: ec2,
    vpc: vpc,

    build: function build(cb) {
      var me = this;
      var finished = _.after(1, function(){ me.postBuild(); cb();});
      console.log("Creating site:".yellow, config.siteName);
      //groups
      this.createGroups(function(err, data){
        if(err.code === 1){
          console.log(err.msg);
        } else {
          console.log(data.msg);
        }
        finished();
      });
    },
    createGroups: function createGroups(cb){
      GRP.createGroups(this.config.groups, this.vpc, this.ec2);
    },
    postBuild: function postBuild(){

    }
  }
};
