

/*
cloudinary.uploader.upload(file.entry.path,
    {
        resource_type: "video", public_id: "entry" +entryId(),
    },
    function(error, result) {

        console.log("upload err: ", error)
        console.log("resut: ", result)

        if(!error) {
            createEntry(result.secure_url, fields.owner, fields.challenge, challenge.date, challenge.number);
        }else{
            return res.status(500).json({
                message: 'video upload error.',
                error: error
            });
        }
    }
);*/
