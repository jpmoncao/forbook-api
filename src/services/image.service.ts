import { getFirebaseApp } from "@/config/firebase";
import ImageRepository from "@/repositories/image.repository";
import imageRepository from "@/repositories/image.repository";
import { v4 as uuidv4 } from "uuid";

export default class ImageService {
    private readonly repository: ImageRepository;

    constructor() {
        this.repository = new ImageRepository();
    }

    uploadImage = async (image: Buffer, mimetype: string) => {
        const firebaseApp = getFirebaseApp();

        const fileName = `${Date.now()}-${uuidv4()}`;
        const firebaseFile = firebaseApp.storage().bucket().file(`images/${fileName}.${mimetype.split("/")[1]}`);

        firebaseFile.save(image, { public: true });

        const [url] = await firebaseFile.getSignedUrl({ action: 'read', expires: '03-09-2491' });

        const createdImage = await this.repository.create({ url });
        return createdImage;
    }
}