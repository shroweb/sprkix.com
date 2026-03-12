/*
  Warnings:

  - You are about to drop the column `duration` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Match` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Match" DROP COLUMN "duration",
DROP COLUMN "title",
DROP COLUMN "type";
