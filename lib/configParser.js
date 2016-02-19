var _ = require("underscore");
var util = require("util");
var configGlobals = {};

module.exports = function(){
  return {
    parsedConfig: {},
    parse: function parse(orgName) {
      var me = this;
      this.parsedConfig = {};
      this.configFile = "../conf/" + orgName + ".json";
      var orgConfig = require(this.configFile);
      configGlobals['orgName'] = orgConfig.orgName;


      this.parsedConfig.orgName = orgConfig.orgName;
      this.parsedConfig.vpcCidr = orgConfig.vpcCidr;
      this.parsedConfig.region = resolveRegion(orgConfig.region),

      this.parsedConfig.sites = {};
      _.each(orgConfig.sites, function (siteConfig, siteName) {
        configGlobals['siteName'] = siteName;

        me.parsedConfig.sites[siteName] = resolveSite(orgName, siteConfig, me.parsedConfig.region);

      });
      return this.parsedConfig;

    }
  }
};

function resolveSite(orgName, siteConfig, region) {
  var blueprint = resolveBlueprint(siteConfig.blueprint, siteConfig.grade);
  return {
    siteName: orgName,
    availabilityZones: resolveAZ(siteConfig.vpcCidr, region),
    blueprint: blueprint,
    groups: resolveGroups(blueprint, siteConfig.grade)
  }
}

function resolveAZ(vpcCidr, region){
  var ret = [];

  vpcCRange = vpcCidr.match(/([0-9]+\.[0-9]+\.[0-9]+\.).*/i)[1];

  _.each(region.availabilityZones, function (zone) {
    if (zone.match(/a$/i)) {
      ret.push({
        "zone": zone,
        "subnet": vpcCRange + "0/26"
      });
    } else if (zone.match(/b$/i)) {
      ret.push({
        "zone": zone,
        "subnet": vpcCRange + "64/26"
      });
    } else if (zone.match(/c$/i)) {
      ret.push({
        "zone": zone,
        "subnet": vpcCRange + "128/26"
      });
    } else if (zone.match(/d$/i)) {
      ret.push({
        "zone": zone,
        "subnet": vpcCRange + "192/26"
      });
    }
  });
  return ret;
}

function resolveRegion(region, vpcCidr) {
  return regionConfig = require('../conf/templates/regions.json')[region];
}

function resolveBlueprint(blueprint, grade) {
  var blueprint = require('../conf/templates/blueprints.json')[blueprint];
  var machines = resolveMachines(blueprint.machines, grade);
  return {
    machines: machines,
    loadBalancers: resolveLoadBalancers(blueprint.loadBalancers, machines)
  }
}

function resolveLoadBalancers(balancers, machines) {
  var ret = {};
  var members = [];
  _.each(balancers, function (balancer, balancerName) {
    _.each(balancer.memberMachines, function (machineType) {
      _.each(machines[machineType], function (machine) {
        members.push(machine.name);
      });
    });

    ret[balancerName] = {
      "memberMachines": members,
      "securityGroups": []
    };
    _.each(balancer.securityGroups, function (groupName) {
      ret[balancerName].securityGroups.push(resolveGroupName(groupName));
    });
  });
  return ret;
}

function resolveMachines(machines, grade) {
  var ret = {};
  _.each(machines, function (number, machine) {
    ret[machine] = resolveMachine(machine, grade, number);
  });
  return ret;
}

function getBareMachineConfig(machine, grade) {
  var machinesConfig = require('../conf/templates/machines.json')[grade][machine];
  if (!machinesConfig) {
    console.log("Error machine does not exist: " + machine + ", " + grade);
    return {};
  }
  return machinesConfig;
}

function resolveMachine(machine, grade, number) {
  var machinesConfig = getBareMachineConfig(machine, grade);
  var ret = [];
  for (var i = 1; i <= number; i++) {
    var retMachine = {
      name: machine + i,
      instanceType: machinesConfig.instanceType,
      roles: machinesConfig.roles,
      groups: resolveGroupNames(machinesConfig.groups),
      volumes: resolveVolumes(machinesConfig.volumes, grade)
    };

    ret.push(retMachine);
  }
  return ret;
}

function resolveVolumes(volumes, grade) {
  var volumesConfig = require("../conf/templates/volumes.json");
  var ret = {};
  _.each(volumes, function (device, name) {
    ret[name] = {
      volumeSize: volumesConfig[grade][device].volumeSize,
      volumeType: volumesConfig[grade][device].volumeType,
      deleteOnTermination: volumesConfig[grade][device].deleteOnTermination,
      encrypted: volumesConfig[grade][device].encrypted,
      device: device
    };
  });
  return ret;
}

function resolveGroups(blueprint, grade) {
  var groupConfig = require("../conf/templates/securityGroups.json");
  var groups = {};
  _.each(blueprint.machines, function(number, type){
    var machine = getBareMachineConfig(type, grade);
    _.each(machine.groups, function(group){
      groups[group] = {};
    });
  });
  var ret = {};
  _.each(groups, function (group, groupName) {
    var config = groupConfig[groupName];

    groupName = resolveGroupName(groupName);

    ret[groupName] = {
      rules: []
    };
    _.each(config.rules, function (rule) {
      var newRule = {
        "protocols": rule.protocols,
        "start": rule.start,
        "end": rule.end,
        "sources": rule.sources || [],
        "groups": []
      };
      _.each(rule.groups, function (subGroupName) {
        newRule.groups.push(resolveGroupName(subGroupName));
      });
      ret[groupName].rules.push(newRule);
    });
  });
  return ret;
}

function resolveGroupNames(groups){
  var ret = [];
  _.each(groups, function (groupName) {
    ret.push(resolveGroupName(groupName));
  });
  return ret
}

function resolveGroupName(groupName) {
  return groupName.replace("{{orgName}}", configGlobals.orgName).replace("{{siteName}}", configGlobals.siteName);
}