import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  // ── Room images — admin only, up to 6 images, 4MB each ─────────────────────
  roomImage: f({ image: { maxFileSize: "4MB", maxFileCount: 6 } })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session || (session.user as any).role !== "ADMIN") {
        throw new UploadThingError("Only admins can upload room images");
      }
      return { userId: (session.user as any).id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  // ── User avatar — any authenticated user ────────────────────────────────────
  userAvatar: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session) throw new UploadThingError("You must be logged in to upload an avatar");
      return { userId: (session.user as any).id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const { default: prisma } = await import("@/lib/prisma");
      await prisma.user.update({
        where: { id: metadata.userId },
        data: { avatar: file.ufsUrl },
      });
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
