'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const Sharp = require('sharp');
var crypto = require('crypto');

const BUCKET = process.env.BUCKET;
const URL = process.env.URL;

function randomValueHex (len) {
    return crypto.randomBytes(Math.ceil(len/2))
        .toString('hex') // convert to hexadecimal format
        .slice(0,len);   // return required number of characters
}

exports.handler = function(event, context, callback) {
  const key = event.queryStringParameters.key;
  const match = key.match(/(\d+)x(\d+)\/(.*)/);
  const width = parseInt(match[1], 10);
  const height = parseInt(match[2], 10);
  const originalKey = match[3];

  S3.getObject({Bucket: BUCKET, Key: originalKey}).promise()
    .then(data => Sharp(data.Body)
      .resize(width, height)
      .toFormat('png')
      .toBuffer()
    )
    .then(buffer => S3.putObject({
        Body: buffer,
        Bucket: BUCKET,
        ContentType: 'image/png',
        Key: key,
      }).promise()
    )
    .then(() => callback(null, {
        statusCode: '307',
        headers: {'location': `${URL}/${key}?${randomValueHex(12)}`},
        body: '',
      })
    )
    .catch(err => callback(err))
}
