var fs = require('fs');
module.exports.findKeyPair = function(kpName, ec2, cb){
  ec2.describeKeyPairs({
    Filters: [
      {
        Name: "key-name",
        Values: [
          kpName
        ]
      }
    ]
  }, function(err, data){
    if(data.KeyPairs.length > 0){
      cb(null, data.KeyPairs[0]);
    } else {
      cb(true, {});
    }
  });
};

module.exports.createKeyPair = function(config, ec2, cb){
  kpName = "fh-kp-" + config.orgName;
  var retErr = {}, retData = {};
  this.findKeyPair(kpName, ec2, function(err, kp) {
    if(kp.KeyName){
      retErr = {"code": 1, "msg": kp.KeyName + " exists."};
      cb(retErr, retData);
      return;
    }
    params = {
      KeyName: kpName
    };
    ec2.createKeyPair(params, function (err, data) {
      fs.writeFileSync(
        "/Users/pbrookes/repos/henry-ops/trunk/FHCaws/auth/keys/" + ec2.config.credentials.profile.replace('profile ', '') +"/" + kpName + ".pem",
        data.KeyMaterial
      );
      cb({}, {"msg": "Created keypair: " + kpName});
    });
  });
};