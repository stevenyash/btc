export class MuseService {
  async uploadVideo(filePath: string, fileName: string): Promise<any> {
    console.log("MuseService: uploadVideo called", { filePath, fileName });
    throw new Error("MuseService not implemented - configuration missing");
  }

  async getVideo(videoId: string): Promise<any> {
    throw new Error("MuseService not implemented");
  }

  async deleteVideo(videoId: string): Promise<any> {
    throw new Error("MuseService not implemented");
  }
}

export default new MuseService();