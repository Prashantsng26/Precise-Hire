import dotenv from 'dotenv';
dotenv.config();
import { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { TextractClient } from '@aws-sdk/client-textract';
import { SESClient } from '@aws-sdk/client-ses';

const awsConfig = {
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
};

export const s3Client = new S3Client(awsConfig);
export const dynamoClient = new DynamoDBClient(awsConfig);
export const docClient = DynamoDBDocumentClient.from(dynamoClient);
export const textractClient = new TextractClient(awsConfig);
export const sesClient = new SESClient(awsConfig);
