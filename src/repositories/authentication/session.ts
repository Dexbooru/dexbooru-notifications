import BaseRepository from "../../core/base-repository";
import type { TUserSession } from "../../models/authentication/session";
import UserSession from "../../models/authentication/session";

const repositoryName = "UserSessionRepository";

class UserSessionRepository extends BaseRepository<TUserSession> {
  constructor() {
    super(repositoryName, UserSession);
  }
}

export default UserSessionRepository;
