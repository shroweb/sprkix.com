/*
  Warnings:

  - You are about to drop the `ReviewLike` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ReviewLike" DROP CONSTRAINT "ReviewLike_reviewId_fkey";

-- DropForeignKey
ALTER TABLE "ReviewLike" DROP CONSTRAINT "ReviewLike_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "slug" TEXT;

-- DropTable
DROP TABLE "ReviewLike";
