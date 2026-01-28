import BaseRepository from "../../core/base-repository";
import FriendInvite, {
  type TFriendInvite,
} from "../../models/events/friend-invite";

class FriendInviteRepository extends BaseRepository<TFriendInvite> {
  constructor() {
    super("FriendInviteRepository", FriendInvite);
  }
}

export default FriendInviteRepository;