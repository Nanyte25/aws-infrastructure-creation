var _ = require("underscore");
var util = require('util');
var colors = require('colors');
var VPC = require('../lib/vpcs.js');
var KP = require('./keypairs.js');
var IGW = require('./gateways.js');

module.exports = function(config, ec2){

  return {
    config: config,
    ec2: ec2,
    vpc: {},
    gw: {},

    build: function build(cb) {
      var me = this;
      var finished = _.after(3, function(){ me.postBuild(); cb();});

      //keypair
      this.createKeyPair(function(err, data){
        process.stdout.write("Creating keypair: ".yellow);
        if(err.code === 1){
          console.log(err.msg);
        } else {
          console.log(data.msg);
        }
        finished();
      });

      //VPCs
      this.createVpc(function(err, data){
        process.stdout.write("Creating VPC:     ".yellow);
        if(err.code === 1){
          console.log(err.msg);
          me.vpc = err.item;
        } else {
          console.log(data.msg);
          me.vpc = data.item;
        }
        finished();
      });

      //Internet gateway
      this.createInternetGateway(function(err, data){
        process.stdout.write("Creating gateway: ".yellow);
        if(err.code === 1){
          console.log(err.msg);
          me.gw = err.item;
        } else {
          console.log(data.msg);
          me.gw = data.item;
        }
        finished();
      })
    },
    createKeyPair: function createKeyPair(cb){
      KP.createKeyPair(this.config, this.ec2, cb);
    },
    createVpc: function(cb) {
      VPC.buildVPC(this.config, this.ec2, cb);
    },
    createInternetGateway: function createInternetGateway(cb){
      IGW.createInternetGateway(this.config, this.ec2, cb);
    },
    postBuild: function postBuild(){
      this.ec2.attachInternetGateway({
        InternetGatewayId: this.gw.InternetGatewayId,
        VpcId: this.vpc.VpcId
      }, function(err, data){
        console.log(data);
      });
    }
  }
};