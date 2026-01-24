import { Request, Response } from "express";
import User from "../models/User";
import Account from "../models/Account";
import Transfer from "../models/Transfer";
import Bizum from "../models/Bizum";

export const adminListUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ users });
  } catch (err) {
    console.error("adminListUsers error:", err);
    return res.status(500).json({ message: "Error listando usuarios" });
  }
};

export const adminUpdateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const allowed = [
      "name",
      "surname",
      "birthDate",
      "dni",
      "country",
      "city",
      "address",
      "postalCode",
      "email",
      "phone",
      "mainCurrency",
      "role",
    ];

    const update: any = {};
    for (const k of allowed) {
      if (k in req.body) update[k] = req.body[k];
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true })
      .select("-password")
      .lean();

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    return res.json({ message: "Usuario actualizado ✅", user });
  } catch (err) {
    console.error("adminUpdateUser error:", err);
    return res.status(500).json({ message: "Error actualizando usuario" });
  }
};


export const adminUserSummary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password").lean();
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const account = await Account.findOne({
      owner: id,
      isMain: true,
      status: "active",
    }).lean();

    if (!account) {
      return res.json({ user, account: null, movements: [] });
    }


    const transfers = await Transfer.find({
      status: "completed",
      $or: [{ fromAccount: account._id }, { toAccount: account._id }],
    })
      .sort({ date: -1 })
      .limit(30)
      .lean();

    const transferMovs = transfers.map((t: any) => ({
      type: "TRANSFER",
      date: t.date,
      amount: Number(t.amount || 0),
      direction: String(t.fromAccount) === String(account._id) ? "OUT" : "IN",
      concept: t.concept ? `Transferencia · ${t.concept}` : "Transferencia",
    }));

    let bizums: any[] = await Bizum.find({
      status: "COMPLETED",
      $or: [{ fromUser: id }, { toUser: id }],
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean()
      .catch(() => []);

    if (!bizums || bizums.length === 0) {
      bizums = await Bizum.find({
        status: "COMPLETED",
        $or: [{ fromAccount: account._id }, { toAccount: account._id }],
      })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean()
        .catch(() => []);
    }

    const bizumMovs = (bizums || []).map((b: any) => {
      const isOutgoingByUser = b.fromUser && String(b.fromUser) === String(id);
      const isOutgoingByAcc =
        b.fromAccount && String(b.fromAccount) === String(account._id);

      const direction = isOutgoingByUser || isOutgoingByAcc ? "OUT" : "IN";

      return {
        type: "BIZUM",
        date: b.createdAt || b.date || new Date(),
        amount: Number(b.amount || 0),
        direction,
        concept: b.concept ? `Bizum · ${b.concept}` : "Bizum",
      };
    });

    const movements = [...transferMovs, ...bizumMovs].sort(
      (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return res.json({
      user,
      account: {
        _id: account._id,
        iban: account.iban,
        balance: account.balance,
        currency: account.currency,
        status: account.status,
      },
      movements: movements.slice(0, 30),
    });
  } catch (err) {
    console.error("adminUserSummary error:", err);
    return res.status(500).json({ message: "Error cargando resumen de usuario" });
  }
};


export const adminDashboard = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const days7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      usersTotal,
      usersLast7d,
      accountsTotal,
      accountsActive,
      transfersTotal,
      transfersLast7d,
      bizumsTotal,
      bizumsLast7d,
      balanceAgg,
      lastUsers,
      lastTransfers,
      lastBizums,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ createdAt: { $gte: days7 } }),

      Account.countDocuments({}),
      Account.countDocuments({ status: "active" }),

      Transfer.countDocuments({}),
      Transfer.countDocuments({ status: "completed", date: { $gte: days7 } }),

      Bizum.countDocuments({}),
      Bizum.countDocuments({ status: "COMPLETED", createdAt: { $gte: days7 } }),

      Account.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: null, totalBalance: { $sum: "$balance" } } },
      ]),

      User.find().select("-password").sort({ createdAt: -1 }).limit(8).lean(),

      Transfer.find({ status: "completed" })
        .sort({ date: -1 })
        .limit(15)
        .populate({
          path: "fromAccount",
          select: "iban owner",
          populate: { path: "owner", select: "name surname email" },
        })
        .populate({
          path: "toAccount",
          select: "iban owner",
          populate: { path: "owner", select: "name surname email" },
        })
        .lean(),

      Bizum.find({ status: "COMPLETED" })
        .sort({ createdAt: -1 })
        .limit(15)
        .populate({ path: "fromUser", select: "name surname email" })
        .populate({ path: "toUser", select: "name surname email" })
        .populate({
          path: "fromAccount",
          select: "iban owner",
          populate: { path: "owner", select: "name surname email" },
        })
        .populate({
          path: "toAccount",
          select: "iban owner",
          populate: { path: "owner", select: "name surname email" },
        })
        .lean(),
    ]);

    const totalBalance = Number(balanceAgg?.[0]?.totalBalance || 0);

    const fullName = (u: any) => {
      if (!u) return "—";
      const n = [u.name, u.surname].filter(Boolean).join(" ").trim();
      return n || u.email || "—";
    };

    const transferMovs = (lastTransfers || []).map((t: any) => {
      const fromOwner = t.fromAccount?.owner;
      const toOwner = t.toAccount?.owner;

      return {
        type: "TRANSFER",
        date: t.date || t.createdAt || new Date(),
        amount: Number(t.amount || 0),
        concept: t.concept ? `Transferencia · ${t.concept}` : "Transferencia",
        from: {
          name: fullName(fromOwner),
          email: fromOwner?.email || "",
          iban: t.fromAccount?.iban || "",
        },
        to: {
          name: fullName(toOwner),
          email: toOwner?.email || "",
          iban: t.toAccount?.iban || "",
        },
        ref: t._id,
      };
    });

    const bizumMovs = (lastBizums || []).map((b: any) => {
      const fromU = b.fromUser;
      const toU = b.toUser;

      const fromAccOwner = b.fromAccount?.owner;
      const toAccOwner = b.toAccount?.owner;

      const fromResolved = fromU || fromAccOwner || null;
      const toResolved = toU || toAccOwner || null;

      return {
        type: "BIZUM",
        date: b.createdAt || b.date || new Date(),
        amount: Number(b.amount || 0),
        concept: b.concept ? `Bizum · ${b.concept}` : "Bizum",
        from: {
          name: fullName(fromResolved),
          email: fromResolved?.email || "",
          iban: b.fromAccount?.iban || "",
        },
        to: {
          name: fullName(toResolved),
          email: toResolved?.email || "",
          iban: b.toAccount?.iban || "",
        },
        ref: b._id,
      };
    });

    const recentMovements = [...transferMovs, ...bizumMovs]
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);

    return res.json({
      kpis: {
        usersTotal,
        usersLast7d,
        accountsTotal,
        accountsActive,
        totalBalance,
        transfersTotal,
        transfersLast7d,
        bizumsTotal,
        bizumsLast7d,
      },
      lastUsers,
      recentMovements,
    });
  } catch (err) {
    console.error("adminDashboard error:", err);
    return res.status(500).json({ message: "Error cargando admin dashboard" });
  }
};
