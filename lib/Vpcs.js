var util = require('util');
module.exports.findVpc = function(vpcName, ec2, cb){
  ec2.describeVpcs({
    Filters: [
      {
        Name: "tag-value",
        Values: [
          vpcName
        ]
      }
    ]
  }, function(err, data){
    if(data.Vpcs.length > 0){
      cb(null, data.Vpcs[0]);
    } else {
      cb(true, {});
    }
  });
}

module.exports.buildVPC = function(config, ec2, cb){
  vpcName = "fh-vpc-" + config.orgName;
  var retErr = {}, retData = {};

  this.findVpc(vpcName, ec2, function(err, vpc) {
    if(vpc.VpcId){
      retErr = {"code": 1, "msg": vpc.Tags[0].Value + " exists.", item: vpc};
      cb(retErr, retData);
      return;
    }

    params = {
      CidrBlock: config.vpcCidr
    };
    ec2.createVpc(params, function (err, data) {
      var vpc = data['Vpc'];
      ec2.createTags({
        Resources: [
          vpc['VpcId']
        ],
        Tags: [
          {
            Key: "Name",
            Value: vpcName
          }
        ]
      }, function (err, data) {
        retData = {"msg": "Created VPC: " + vpcName, item: vpc};
        cb(retErr, retData);
        return;
      });
    });
  });
}