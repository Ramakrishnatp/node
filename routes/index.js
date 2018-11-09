var express = require('express');
var router = express.Router();
var moment = require('moment');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var iothub = require('azure-iothub');

const connectionString = 'HostName=ZylfiTP.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=Ysb4XbxLdwHKgf52J9hqlgh4KGlzdMgU6wTlFle4lYs=';
/* GET home page. */
router.get('/', function (req, res, next) {


  // config for your database


  res.render('index', { title: 'Express' });
});



io.on('connection', function (socket) {
  socket.on('ferret', function (name, fn) {
    fn('woot');
  });
});

router.get('/iotHUB', function (req, res, next) {
  var iothub = require('azure-iothub');

  var registry = iothub.Registry.fromConnectionString(connectionString);
  registry.list((err, deviceList) => {
    // deviceList.forEach((device) => {
    //   let key = device.authentication ? device.authentication.symmetricKey.primaryKey : '<no primary key>';
    //  // console.log(device.deviceId + ': ' + key);
    // });
    res.json(deviceList);
  });
});

router.get('/iotHUBSingleDevice', function (req, res, next) {
  var deviceId = 12;
  var iothub = require('azure-iothub');
  // var connectionString = 'HostName=ZYLFI.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=tH5hEGYfilY5Owg/8OOLpBUcSzdVrlbKlRUdPEUgP5U=';
  var registry = iothub.Registry.fromConnectionString(connectionString);
  registry.get(deviceId, printResult);

  function printResult(err, deviceInfo, res) {
    if (err) console.log(' error: ' + err.toString());
    if (res) console.log(' status: ' + res.statusCode + ' ' + res.statusMessage);
    if (deviceInfo) console.log(' device info: ' + JSON.stringify(deviceInfo, null, 2));
  }

});

router.get('/sasToken', function (req, res, next) {
  var sas = require('shared-access-signature');
  var url = 'ZYLFI.azure-devices.net/devices';
  var sharedAccessKeyName = 'sak';
  var sharedAccessKey = 'YBQbramrGavLULWW+mj80PuKiN0zwke/4OZ1sK2uvwI=';
  var currentDate = new Date();
  var expiry = moment(currentDate).add(10000, 'days').format('YYYYMMDD');// We require expiry time in seconds since epoch.
  var sas = require('shared-access-signature');
  var signature = sas.generateServiceBusSignature(url, sharedAccessKeyName, sharedAccessKey, expiry);
  console.log(signature);
  res.json(signature);
});

router.get('/addSingleDevice', function (req, res, next) {

  var deviceId = 12;

  var registry = iothub.Registry.fromConnectionString(connectionString);
  // Create a new device
  var device = {
    deviceId: 'sample-device-' + Date.now()
  };
  registry.create(device, function (err, deviceInfo, res) {
    if (err) console.log(op + ' error: ' + err.toString());
    if (res) console.log(op + ' status: ' + res.statusCode + ' ' + res.statusMessage);
    if (deviceInfo) console.log(op + ' device info: ' + JSON.stringify(deviceInfo));
  });
});

router.get('/iotHUBSend', function (req, res, next) {
  var Client = require('azure-iothub').Client;
  var Message = require('azure-iot-common').Message;
  //var connectionString = 'HostName=ZYLFI.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=tH5hEGYfilY5Owg/8OOLpBUcSzdVrlbKlRUdPEUgP5U=';
  var targetDevice = 'DV19000108';
  var client = Client.fromConnectionString(connectionString);
  client.open(function (err) {
    if (err) {
      console.error('Could not connect: ' + err.message);
    } else {
      console.log('Client connected');
      var data = JSON.stringify(1123);
      var message = new Message(data);
      console.log('Sending message: ' + message.getData());
      client.send(targetDevice, message, printResultFor('send'));
    }
  });

  // Helper function to print results in the console
  function printResultFor(op) {
    return function printResult(err, res) {
      if (err) {
        console.log(op + ' error: ' + err.toString());
      } else {
        console.log(op + ' status: ' + res.constructor.name);
      }
    };
  }
});

router.post('/iotHUBOn', function (req, res, next) {
  console.log(req.body);
  var Client = require('azure-iothub').Client;
  //var connectionString = 'HostName=ZYLFI.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=tH5hEGYfilY5Owg/8OOLpBUcSzdVrlbKlRUdPEUgP5U=';
  var targetDevice = req.body.DeviceId;
  var methodParams = {
    methodName: 'AzureIoTC2DMethod',
    payload: {
      "DeviceId": req.body.DeviceId,
      "ChannelNo": req.body.ChannelNo,
      "On_Off": req.body.On_Off,
      "ApplianceType": req.body.ApplianceType,
      "temp": req.body.temp+"",
      "decTemp": req.body.decTemp + "",
      "incTemp": req.body.incTemp + "",
    },
    responseTimeoutInSeconds: 15 // set response timeout as 15 seconds 
  };
  // var methodParams1 = {
  //   methodName: 'deviceOff',
  //   payload: '1',
  //   responseTimeoutInSeconds: 15 // set response timeout as 15 seconds 
  // };
  var client = Client.fromConnectionString(connectionString);
  client.invokeDeviceMethod(targetDevice, methodParams, function (err, result) {
    if (err) {
      console.error('Failed to invoke method \'' + methodParams.methodName + '\': ' + err.message);
      res.send(500);
    } else {
      console.log(methodParams.methodName + ' on ' + targetDevice + ':');
      res.json(result);
      console.log(JSON.stringify(result, null, 2));
    }
  });
  // client.invokeDeviceMethod(targetDevice, methodParams1, function (err, result) {
  //   if (err) {
  //     console.error('Failed to invoke method \'' + methodParams.methodName + '\': ' + err.message);
  //   } else {
  //     console.log(methodParams.methodName + ' on ' + targetDevice + ':');
  //     console.log(JSON.stringify(result, null, 2));
  //   }
  // });
});
router.get('/iotHUBReadData', function (req, res, next) {
  //var connectionString = 'HostName=ZYLFI.azure-devices.net;SharedAccessKeyName=service;SharedAccessKey=zgRCdOQw8bhgazr96iaDgzFoX35dhwsmMXEqLTKgAps=';
  // Using the Node.js SDK for Azure Event hubs:
  //   https://github.com/Azure/azure-event-hubs-node
  // The sample connects to an IoT hub's Event Hubs-compatible endpoint
  // to read messages sent from a device.
  var { EventHubClient, EventPosition } = require('@azure/event-hubs');
  var printError = function (err) {
    console.log(err.message);
  };
  // Display the message content - telemetry and properties.
  // - Telemetry is sent in the message body
  // - The device can add arbitrary application properties to the message
  // - IoT Hub adds system properties, such as Device Id, to the message.
  var printMessage = function (message) {
    console.log('Telemetry received: ');
    console.log(JSON.stringify(message));
    console.log('Application properties (set by device): ')
    console.log(JSON.stringify(message));
    console.log('System properties (set by IoT Hub): ')
    console.log(JSON.stringify(message));
    console.log('');
  };
  var ehClient;
  EventHubClient.createFromIotHubConnectionString(connectionString).then(function (client) {
    console.log("Successully created the EventHub Client from iothub connection string.");
    ehClient = client;
    return ehClient.getPartitionIds();
  }).then(function (ids) {
    console.log("The partition ids are: ", ids);
    return ids.map(function (id) {
      return ehClient.receive(id, printMessage, printError, { eventPosition: EventPosition.fromEnqueuedTime(Date.now()) });
    });
  }).catch(printError);
});

router.get('/iotHUBD', function (req, res, next) {
  var Client = require('azure-iothub').Client;
  //var connectionString = 'HostName=ZYLFI.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=tH5hEGYfilY5Owg/8OOLpBUcSzdVrlbKlRUdPEUgP5U=;DeviceId=12';
  var Protocol = require('azure-iot-device-mqtt').Mqtt;
  var Client = require('azure-iot-device').Client;
  var Message = require('azure-iot-device').Message;
  var client = Client.fromConnectionString(connectionString, Protocol);
  var connectCallback = function (err) {
    if (err) {
      console.error('Could not connect: ' + err.message);
    } else {
      console.log('Client connected');
      client.on('message', function (msg) {
        console.log('Id: ' + msg.messageId + ' Body: ' + msg.data);
        // When using MQTT the following line is a no-op.
        client.complete(msg, printResultFor('completed'));
        console.log("MSG" + JSON.stringify(msg));
      });
      client.on('error', function (err) {
        console.error(err.message);
      });
      client.on('disconnect', function () {
        clearInterval(sendInterval);
        client.removeAllListeners();
        client.open(connectCallback);
      });
    }
  };

  client.open(connectCallback);

  // Helper function to print results in the console
  function printResultFor(op) {
    return function printResult(err, res) {
      if (err) console.log(op + ' error: ' + err.toString());
      if (res) console.log(op + ' status: ' + res.constructor.name);
    };
  }

})


http.listen(3001, function () {
  console.log('listening on *:3000');
});

module.exports = router;
