import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function DiskForensicsAndFileSystemAnalysis() {
  return (
    <div className="prose-hh">
      <h1>Disk Forensics & File System Analysis</h1>
      <p>
        Lesson 2 covered recovering deleted files at a conceptual level. This lesson goes deeper into how a
        file system actually works under the hood — specifically NTFS's Master File Table — and why "deleted"
        almost never means what most people assume it means.
      </p>

      <h2>Why deleting a file doesn't erase its data</h2>
      <CodeBlock label="what actually happens when a file is deleted on nearly every mainstream file system">{`1. The file system marks the space the file occupied as AVAILABLE for
   reuse -- it does NOT overwrite the actual data blocks
2. The file's entry in the file system's index (NTFS's $MFT, or the
   equivalent structure on other file systems) is flagged as deleted,
   but the entry itself -- including the original filename, timestamps,
   and pointers to where the data blocks WERE -- frequently remains
   intact until that MFT entry itself gets reused
3. The actual file content remains fully recoverable, byte for byte,
   until something else happens to be written into those specific blocks`}</CodeBlock>
      <Callout variant="tip">
        <p>
          This is the single most important mental model in disk forensics: "deleted" means "the space is
          available," not "the data is gone." A drive that's been actively used since deletion has a
          decreasing (but often still meaningful) chance of full recovery as more new data overwrites the
          freed space; a drive imaged shortly after deletion, or one with substantial free space that was never
          reused, is frequently close to 100% recoverable.
        </p>
      </Callout>

      <h2>NTFS's Master File Table: the structure that makes recovery possible</h2>
      <CodeBlock label="reading $MFT entries directly">{`Every file and directory on an NTFS volume has a $MFT record containing:
  - Standard Information attribute: the four MACB timestamps (Modified,
    Accessed, Created, MFT-record-Changed) -- the SAME timestamps every
    earlier lesson's timeline-analysis technique reads
  - Filename attribute: the file's name(s) -- NTFS can store BOTH a long
    filename and an auto-generated short (8.3) filename in the same record
  - Data attribute: either the actual file content directly (for very
    small "resident" files stored inline in the MFT record itself) or
    pointers to the data's location on disk (for larger "non-resident" files)

mmls disk_image.dd              # Sleuth Kit -- list partition layout
fls -r -m / disk_image.dd         # recursively list files, INCLUDING
                                     deleted entries still present in $MFT
icat disk_image.dd 4127             # extract a specific file's content
                                       by its MFT record number, deleted
                                       or not`}</CodeBlock>

      <h2>File carving: recovery when even the MFT entry is gone</h2>
      <p>
        Sometimes the MFT entry itself has already been reused, but the actual DATA blocks haven't been
        overwritten yet — no filename, no timestamps, no directory structure to work from at all. File carving
        recovers content purely from its BINARY SIGNATURE, the same magic-byte-matching concept as the IoT
        module's <code>binwalk</code> firmware-extraction technique, just applied to a raw disk image instead
        of a firmware blob.
      </p>
      <CodeBlock label="carving files with no filesystem metadata to work from at all">{`foremost -i disk_image.dd -o carved_output/
  -- scans the raw disk image for known file-type header/footer byte
     signatures (JPEG's FFD8...FFD9, PDF's %PDF...%%EOF, ZIP's PK\\x03\\x04)
     and extracts everything between a matching header and footer,
     completely independent of any file system structure at all --
     the last-resort recovery technique when even $MFT itself has
     already been overwritten`}</CodeBlock>

      <h2>Autopsy: the practical, GUI-based workflow real investigators use</h2>
      <p>
        Autopsy (the graphical front-end for the Sleuth Kit command-line tools used throughout this lesson)
        remains one of the most widely used open-source forensic platforms in real DFIR work — combining
        timeline analysis, keyword search across both allocated and unallocated (deleted) space, and automated
        file carving into a single case-management workflow, letting an examiner move between the manual
        command-line techniques in this lesson and a structured case review without switching tools entirely.
      </p>

      <Callout variant="warn">
        <p>
          Every technique in this lesson must be performed against a forensic IMAGE (a bit-for-bit copy, taken
          with a write-blocker to guarantee the original media is never modified) — never against the original
          evidence directly, per Lesson 1's chain-of-custody material. Running <code>foremost</code> or any
          other tool directly against a live, mounted original drive risks writing to it and destroying exactly
          the unallocated-space evidence this lesson depends on recovering.
        </p>
      </Callout>

      <p>
        With filesystem-level recovery covered, the next lesson moves from disk to memory — a deeper,
        tool-driven pass through memory forensics using Volatility, extending Lesson 2's strings-based
        introduction into a systematic, structured methodology.
      </p>
    </div>
  );
}
