import BaseRepository from "../../core/base-repository";
import type { TUserSession } from "../../models/authentication/session";
import UserSession from "../../models/authentication/session";
import Logger from "../../core/logger";

const repositoryName = "UserSessionRepository";

class UserSessionRepository extends BaseRepository<TUserSession> {
  constructor() {
    super(repositoryName, UserSession);
  }

  public async deleteByToken(token: string): Promise<boolean> {
    try {
      const result = await this.model.deleteOne({ token }).exec();
      return result.deletedCount > 0;
    } catch (error) {
      Logger.instance.error(`Error in ${repositoryName}.deleteByToken:`, error);
      throw error;
    }
  }
}

export default UserSessionRepository;
