"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsdevhourStack = void 0;
const cdk = require("@aws-cdk/core");
const s3 = require("@aws-cdk/aws-s3");
const iam = require("@aws-cdk/aws-iam");
const dynamodb = require("@aws-cdk/aws-dynamodb");
const lambda = require("@aws-cdk/aws-lambda");
const event_sources = require("@aws-cdk/aws-lambda-event-sources");
const core_1 = require("@aws-cdk/core");
const imageBucketName = "cdk-rekn-imgagebucket";
const resizedBucketName = imageBucketName + "-resized";
class AwsdevhourStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // =====================================================================================
        // Image Bucket
        // =====================================================================================
        const imageBucket = new s3.Bucket(this, imageBucketName, {
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        new cdk.CfnOutput(this, 'imageBucket', { value: imageBucket.bucketName });
        // =====================================================================================
        // Thumbnail Bucket
        // =====================================================================================
        const resizedBucket = new s3.Bucket(this, resizedBucketName, {
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        new cdk.CfnOutput(this, 'resizedBucket', { value: resizedBucket.bucketName });
        // =====================================================================================
        // Amazon DynamoDB table for storing image labels
        // =====================================================================================
        const table = new dynamodb.Table(this, 'ImageLabels', {
            partitionKey: { name: 'image', type: dynamodb.AttributeType.STRING },
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        new cdk.CfnOutput(this, 'ddbTable', { value: table.tableName });
        // =====================================================================================
        // Building our AWS Lambda Function; compute for our serverless microservice
        // =====================================================================================
        const layer = new lambda.LayerVersion(this, 'pil', {
            code: lambda.Code.fromAsset('reklayer'),
            compatibleRuntimes: [lambda.Runtime.PYTHON_3_7],
            license: 'Apache-2.0',
            description: 'A layer to enable the PIL library in our Rekognition Lambda',
        });
        // =====================================================================================
        // Building our AWS Lambda Function; compute for our serverless microservice
        // =====================================================================================
        const rekFn = new lambda.Function(this, 'rekognitionFunction', {
            code: lambda.Code.fromAsset('rekognitionlambda'),
            runtime: lambda.Runtime.PYTHON_3_7,
            handler: 'index.handler',
            timeout: core_1.Duration.seconds(30),
            memorySize: 1024,
            layers: [layer],
            environment: {
                "TABLE": table.tableName,
                "BUCKET": imageBucket.bucketName,
                "RESIZEDBUCKET": resizedBucket.bucketName
            },
        });
        rekFn.addEventSource(new event_sources.S3EventSource(imageBucket, { events: [s3.EventType.OBJECT_CREATED] }));
        imageBucket.grantRead(rekFn);
        resizedBucket.grantPut(rekFn);
        table.grantWriteData(rekFn);
        rekFn.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['rekognition:DetectLabels'],
            resources: ['*']
        }));
        // =====================================================================================
        // Lambda for Synchronous Front End
        // =====================================================================================
        const serviceFn = new lambda.Function(this, 'serviceFunction', {
            code: lambda.Code.fromAsset('servicelambda'),
            runtime: lambda.Runtime.PYTHON_3_7,
            handler: 'index.handler',
            environment: {
                "TABLE": table.tableName,
                "BUCKET": imageBucket.bucketName,
                "RESIZEDBUCKET": resizedBucket.bucketName
            },
        });
        imageBucket.grantWrite(serviceFn);
        resizedBucket.grantWrite(serviceFn);
        table.grantReadWriteData(serviceFn);
    }
}
exports.AwsdevhourStack = AwsdevhourStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXdzZGV2aG91ci1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImF3c2RldmhvdXItc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscUNBQXFDO0FBQ3JDLHNDQUF1QztBQUN2Qyx3Q0FBeUM7QUFDekMsa0RBQW1EO0FBQ25ELDhDQUErQztBQUMvQyxtRUFBb0U7QUFDcEUsd0NBQXlDO0FBRXpDLE1BQU0sZUFBZSxHQUFHLHVCQUF1QixDQUFBO0FBQy9DLE1BQU0saUJBQWlCLEdBQUcsZUFBZSxHQUFHLFVBQVUsQ0FBQTtBQUV0RCxNQUFhLGVBQWdCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDNUMsWUFBWSxLQUFvQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUNsRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4Qix3RkFBd0Y7UUFDeEYsZUFBZTtRQUNmLHdGQUF3RjtRQUN4RixNQUFNLFdBQVcsR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUN2RCxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1NBQ3pDLENBQUMsQ0FBQztRQUNILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFLEVBQUUsS0FBSyxFQUFFLFdBQVcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBRTFFLHdGQUF3RjtRQUN4RixtQkFBbUI7UUFDbkIsd0ZBQXdGO1FBQ3hGLE1BQU0sYUFBYSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDM0QsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztTQUN6QyxDQUFDLENBQUM7UUFDSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRSxFQUFDLEtBQUssRUFBRSxhQUFhLENB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QVEsRUFBRSxXQUFXLENBQUMsVUFBVTtnQkFDaEMsZUFBZSxFQUFFLGFBQWEsQ0FBQyxVQUFVO2FBQzFDO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsV0FBVyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNsQyxhQUFhLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3BDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN0QyxDQUFDO0NBQ0Y7QUF0RkQsMENBc0ZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0IHMzID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLXMzJyk7XG5pbXBvcnQgaWFtID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWlhbScpO1xuaW1wb3J0IGR5bmFtb2RiID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWR5bmFtb2RiJyk7XG5pbXBvcnQgbGFtYmRhID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWxhbWJkYScpO1xuaW1wb3J0IGV2ZW50X3NvdXJjZXMgPSByZXF1aXJlKCdAYXdzLWNkay9hd3MtbGFtYmRhLWV2ZW50LXNvdXJjZXMnKTtcbmltcG9ydCB7IER1cmF0aW9uIH0gZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5cbmNvbnN0IGltYWdlQnVja2V0TmFtZSA9IFwiY2RrLXJla24taW1nYWdlYnVja2V0XCJcbmNvbnN0IHJlc2l6ZWRCdWNrZXROYW1lID0gaW1hZ2VCdWNrZXROYW1lICsgXCItcmVzaXplZFwiXG5cbmV4cG9ydCBjbGFzcyBBd3NkZXZob3VyU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkNvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIEltYWdlIEJ1Y2tldFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjb25zdCBpbWFnZUJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgaW1hZ2VCdWNrZXROYW1lLCB7XG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZXG4gICAgfSk7XG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ2ltYWdlQnVja2V0JywgeyB2YWx1ZTogaW1hZ2VCdWNrZXQuYnVja2V0TmFtZSB9KTtcbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gVGh1bWJuYWlsIEJ1Y2tldFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjb25zdCByZXNpemVkQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCByZXNpemVkQnVja2V0TmFtZSwge1xuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWVxuICAgIH0pO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdyZXNpemVkQnVja2V0Jywge3ZhbHVlOiByZXNpemVkQnVja2V0LmJ1Y2tldE5hbWV9KTtcbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gQW1hem9uIER5bmFtb0RCIHRhYmxlIGZvciBzdG9yaW5nIGltYWdlIGxhYmVsc1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjb25zdCB0YWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnSW1hZ2VMYWJlbHMnLCB7XG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2ltYWdlJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1lcbiAgICB9KTtcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnZGRiVGFibGUnLCB7IHZhbHVlOiB0YWJsZS50YWJsZU5hbWUgfSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gQnVpbGRpbmcgb3VyIEFXUyBMYW1iZGEgRnVuY3Rpb247IGNvbXB1dGUgZm9yIG91ciBzZXJ2ZXJsZXNzIG1pY3Jvc2VydmljZVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjb25zdCBsYXllciA9IG5ldyBsYW1iZGEuTGF5ZXJWZXJzaW9uKHRoaXMsICdwaWwnLCB7XG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJ3Jla2xheWVyJyksXG4gICAgICBjb21wYXRpYmxlUnVudGltZXM6IFtsYW1iZGEuUnVudGltZS5QWVRIT05fM183XSxcbiAgICAgIGxpY2Vuc2U6ICdBcGFjaGUtMi4wJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQSBsYXllciB0byBlbmFibGUgdGhlIFBJTCBsaWJyYXJ5IGluIG91ciBSZWtvZ25pdGlvbiBMYW1iZGEnLFxuICAgIH0pO1xuICAgIOKAi1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBCdWlsZGluZyBvdXIgQVdTIExhbWJkYSBGdW5jdGlvbjsgY29tcHV0ZSBmb3Igb3VyIHNlcnZlcmxlc3MgbWljcm9zZXJ2aWNlXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNvbnN0IHJla0ZuID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAncmVrb2duaXRpb25GdW5jdGlvbicsIHtcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgncmVrb2duaXRpb25sYW1iZGEnKSxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLlBZVEhPTl8zXzcsXG4gICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICB0aW1lb3V0OiBEdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgIG1lbW9yeVNpemU6IDEwMjQsXG4gICAgICBsYXllcnM6IFtsYXllcl0sXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgIFwiVEFCTEVcIjogdGFibGUudGFibGVOYW1lLFxuICAgICAgICAgIFwiQlVDS0VUXCI6IGltYWdlQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICAgICAgXCJSRVNJWkVEQlVDS0VUXCI6IHJlc2l6ZWRCdWNrZXQuYnVja2V0TmFtZVxuICAgICAgfSxcbiAgICB9KTtcbiAgICBcbiAgICByZWtGbi5hZGRFdmVudFNvdXJjZShuZXcgZXZlbnRfc291cmNlcy5TM0V2ZW50U291cmNlKGltYWdlQnVja2V0LCB7IGV2ZW50czogWyBzMy5FdmVudFR5cGUuT0JKRUNUX0NSRUFURUQgXX0pKTtcbiAgICBpbWFnZUJ1Y2tldC5ncmFudFJlYWQocmVrRm4pO1xuICAgIHJlc2l6ZWRCdWNrZXQuZ3JhbnRQdXQocmVrRm4pO1xuICAgIHRhYmxlLmdyYW50V3JpdGVEYXRhKHJla0ZuKTtcblxuICAgIHJla0ZuLmFkZFRvUm9sZVBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbJ3Jla29nbml0aW9uOkRldGVjdExhYmVscyddLFxuICAgICAgcmVzb3VyY2VzOiBbJyonXVxuICAgIH0pKTtcbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gTGFtYmRhIGZvciBTeW5jaHJvbm91cyBGcm9udCBFbmRcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIOKAi1xuICAgIGNvbnN0IHNlcnZpY2VGbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ3NlcnZpY2VGdW5jdGlvbicsIHtcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnc2VydmljZWxhbWJkYScpLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuUFlUSE9OXzNfNyxcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFwiVEFCTEVcIjogdGFibGUudGFibGVOYW1lLFxuICAgICAgICBcIkJVQ0tFVFwiOiBpbWFnZUJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgICBcIlJFU0laRURCVUNLRVRcIjogcmVzaXplZEJ1Y2tldC5idWNrZXROYW1lXG4gICAgICB9LFxuICAgIH0pO1xuICAgIOKAi1xuICAgIGltYWdlQnVja2V0LmdyYW50V3JpdGUoc2VydmljZUZuKTtcbiAgICByZXNpemVkQnVja2V0LmdyYW50V3JpdGUoc2VydmljZUZuKTtcbiAgICB0YWJsZS5ncmFudFJlYWRXcml0ZURhdGEoc2VydmljZUZuKTtcbiAgfVxufVxuIl19