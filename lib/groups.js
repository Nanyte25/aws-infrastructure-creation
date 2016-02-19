var util = require('util');
var _ = require('underscore');

module.exports.createGroups = function createGroups(config, vpc, ec2, cb){
  var me = this;
  _.each(config, (function(group, groupName){
    me.createGroup(groupName, group, vpc, ec2);
  }))
};

module.exports.findGroup = function(groupName, vpc, ec2, cb){
  ec2.describeSecurityGroups({
    Filters: [ {
      Name: 'vpc-id',
      Values: [vpc.VpcId]
    }],
    GroupNames: [
      groupName
    ]
  }, function(err, data){
    console.log(err, data);
    if(data.InternetGateways.length > 0){
      cb(null, data.InternetGateways[0]);
    } else {
      cb(true, {});
    }
  });
}

module.exports.createGroup = function createGroup(groupName, config, vpc, ec2){
  this.findGroup(groupName, ec2, function(err, data){
/*    ec2.createSecurityGroup({
      Description: groupName,
      GroupName: groupName,
      VpcId: vpc.VpcId
    }, function(err, data){

    });
*/
  });
}