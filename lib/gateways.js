var util = require('util');
module.exports.findGw = function(gwName, ec2, cb){
  ec2.describeInternetGateways({
    Filters: [
      {
        Name: "tag-value",
        Values: [
          gwName
        ]
      }
    ]
  }, function(err, data){
    if(data.InternetGateways.length > 0){
      cb(null, data.InternetGateways[0]);
    } else {
      cb(true, {});
    }
  });
}

module.exports.createInternetGateway = function(config, ec2, cb){
  var gwName = "fh-gw-" + config.orgName;
  var retErr = {}, retData = {};

  this.findGw(gwName, ec2, function(err, gw) {
    if(gw.InternetGatewayId){
      retErr = {"code": 1, "msg": gw.Tags[0].Value + " exists.", item: gw};
      cb(retErr, retData);
      return;
    }

    ec2.createInternetGateway({}, function (err, data) {
      var gw = data['InternetGateway'];
      ec2.createTags({
        Resources: [
          gw['InternetGatewayId']
        ],
        Tags: [
          {
            Key: "Name",
            Value: gwName
          }
        ]
      }, function (err, data) {
        retData = {"msg": "Created Gateway: " + gwName, item: gw};
        cb(retErr, retData);
        return;
      });
    });
  });
}