data "aws_iam_policy_document" "thumbnails_policy" {
  statement {
    sid = "1"

    actions = [
      "s3:*",
    ]

    resources = [
        "arn:aws:s3:::${aws_s3_bucket.gallery-uploads.bucket}",
        "arn:aws:s3:::${aws_s3_bucket.gallery-uploads.bucket}/*",
        "arn:aws:s3:::${aws_s3_bucket.gallery-public.bucket}",
        "arn:aws:s3:::${aws_s3_bucket.gallery-public.bucket}/*"
    ]
  }

}

resource "aws_iam_policy" "thumbnails_policy" {
  name   = "thumbnails_policy"
  path   = "/"
  policy = data.aws_iam_policy_document.thumbnails_policy.json
}

resource "aws_iam_policy_attachment" "thumbnails_attach" {
  name       = "thumbnails_attach"
  roles      = [aws_iam_role.thumbnails_role.name]
  policy_arn = aws_iam_policy.thumbnails_policy.arn
}