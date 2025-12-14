module.exports = {
  async findSuperiorBySubordinateId(db, subordinate_id) {
    const repo = db.getRepository('SorcererSubordination');
    const rel = await repo.findOne({ where: { subordinate_id } });
    if (!rel) return null;
    const sorcererRepo = db.getRepository('Sorcerer');
    return await sorcererRepo.findOne({ where: { id: rel.superior_id } });
  }
};
