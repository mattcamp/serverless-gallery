# Serverless Image Gallery

This is a project I built for the [DeepRacing.IO](https://deepracing.io) community.

It's entirely serverless based on the AWS stack (S3, Lambda, DynamoDB and Cognito).
Terraform is used to automatically deploy all the AWS resources.

This started off as a small project which rapidly expanded, but it was a fun learning exercise.

### Workflow:
* Users upload a collection of photos directly to S3 using presigned URLS (signed by a lambda function). These images are only viewable by a gallery admin (a Cognito user). Another lambda automatically creates thumbnails.
* Admin selects from the uploaded images and adds them to a public gallery. Public galleries can be created new, or images can be added to an existing gallery. Another lambda does the heavy lifting of copying files, etc.
* Visitors view the galleries which are served directly out of a public S3 bucket. 

### How to install:

1. Ensure you have working aws cli access in a terminal with a role that will allow you to create AWS resources.
2. Install [Terraform](https://www.terraform.io/downloads.html) (at time of writing I was using v0.12.18)
3. Build the lambda zip files. You need to cd into each subdirectory under `lambda/` and run `zip -r lambda.zip .`
4. cd into `terraform/` 
5. Edit `terraform/backend.tf` and set up your state bucket (you may need to create this first if using S3 terraform state). Also set your AWS region and replace `mtest` with your own prefix which will be used when creating other S3 buckets.
6. Run `terraform init`
7. Run `terraform plan` and if everything looks ok, `terraform apply`
8. cd into `public-web` and run `aws s3 sync ./ s3://<your-s3-prefix>-gallery-public --acl public-read` to upload the files into the public bucket.
9. Use the AWS Console to add admin users to your Cognito user pool. Set a temporary password (they will be required to set a new one upon first login)
10. Hit the public URL for your gallery-public bucket to view your gallery!
11. add `/admin.html` to the end of your public gallery bucket URL to access the admin interface. 

Caveats / Known issues:

* I'm not a javascript developer. I've probably done things badly, but it seems to work. Pull-requests gratefully accepted if you spot something wrong.
* API Gateway is a bit weird when deployed via terraform. If you make any changes you might have to go into the AWS console and re-deploy your API again to get the changes to be picked up.
* Currently the gallery only works with Jpeg and PNG images. Future versions will hopefully handle HEIC/HEIF and video files too.
* If you want to delete or edit a gallery then you need to go into the DynamoDB and S3 AWS Consoles and manually remove/edit entries. Maybe a future version will allow you to do this via the gallery admin interface.

