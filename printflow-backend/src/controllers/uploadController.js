const cloudinary =
    require("../config/cloudinary");

const streamifier =
    require("streamifier");

const sanitizePdfName = (name = "document.pdf") => {
    const baseName = name.replace(/\.pdf$/i, "") || "document";
    return baseName
        .replace(/[^a-zA-Z0-9-_]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || "document";
};

const uploadFile =
    async (req, res) => {

        try {

            if (!req.file) {

                return res.status(400).json({
                    success: false,
                    message:
                        "No file uploaded. Send the PDF as multipart/form-data using the field name \"file\"."
                });

            }

            const uploadStream =
                cloudinary.uploader.upload_stream(

                    {
                        folder: "printflow",
                        resource_type: "raw",
                        public_id: `${Date.now()}-${sanitizePdfName(req.file.originalname)}.pdf`
                    },

                    (error, result) => {

                        if (error) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    error.message
                            });

                        }

                        res.status(200).json({

                            success: true,

                            fileUrl:
                                result.secure_url,

                            publicId:
                                result.public_id

                        });

                    }

                );

            streamifier
                .createReadStream(
                    req.file.buffer
                )
                .pipe(uploadStream);

        } catch (error) {

            res.status(500).json({
                success: false,
                message:
                    error.message
            });

        }

    };

module.exports = {
    uploadFile
};
