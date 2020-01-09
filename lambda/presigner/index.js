'use strict';

const AWS = require('aws-sdk');
const s3 = new AWS.S3({signatureVersion: 'v4'});
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});


exports.handler = (event, context, callback) => {
  const bucket = process.env['s3_bucket'];
  if (!bucket) {
    callback(new Error(`S3 bucket not set`));
  }

  const uploads_table = process.env['uploads_table'];
  if (!uploads_table) {
    callback(new Error(`uploads_table not set`));
  }
  
  const key = event['object_key'];
  if (!key) {
    callback(new Error('S3 object key missing'));
    return;
  }
  
  const name = event['name'];
  if (!name) {
    callback(new Error('name key missing'));
    return;
  }
  
  const email = event['email'];
  if (!email) {
    callback(new Error('email key missing'));
    return;
  }
  
  const event_name = event['event_name'];
  if (!event_name) {
    callback(new Error('event key missing'));
    return;
  }

  var filename = "images/" + key;

  dynamodb.putItem({
        TableName: uploads_table,
        Item: {
            "filename": { S: key },
            "name": { S: name },
            "email": { S: email },
            "event_name": { S: event_name }
        }
    }, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            callback(null, {
                statusCode: '500',
                body: err
            });
        }
    });

  const params = {'Bucket': bucket, 'Key': filename};

  s3.getSignedUrl('putObject', params, (error, url) => {
    if (error) {
      callback(error);
    } else {
      callback(null, {url: url});
    }
  });
};