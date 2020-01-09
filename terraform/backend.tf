terraform {
  backend "s3" {
    bucket = "mtest-tfstate"
    key    = "gallery-terraform"
    region = "eu-west-2"
  }
}

provider "aws" {
  region = "eu-west-2"
}

variable "s3_prefix" {
  type = string
  default = "mtest"
}

