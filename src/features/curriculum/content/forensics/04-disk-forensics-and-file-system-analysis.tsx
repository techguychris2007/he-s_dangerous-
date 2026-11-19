import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function DiskForensicsAndFileSystemAnalysis() {
  return (
    <div className="prose-hh">
      <h1>Disk Forensics &amp; File System Analysis</h1>
      <p>A disk examination is not simply a search for deleted files. Investigators must preserve a source, explain how an image was acquired, understand the file system that organized the bytes, and distinguish observations from conclusions. This lesson uses The Sleuth Kit and Autopsy to examine a forensic image. Run the commands against the supplied lab image or an image you are authorized to analyze; never experiment on a live person's device.</p>

      <h2>Start with preservation and a defensible acquisition</h2>
      <p>Before acquisition, record authority and scope, case identifier, examiner, device make/model and serial, date and time, device state, connection method, and any visible damage or encryption prompt. A hardware write blocker can prevent host writes to supported media; verify the blocker and connection procedure for the device type. A software setting or “read-only” mount is not automatically equivalent to a tested write blocker. If a system is powered on, volatile evidence, encryption state and operational impact can affect whether live acquisition or shutdown is appropriate. Follow incident-response policy and qualified forensic direction rather than applying one sequence to every case.</p>
      <p>A bit-stream image aims to capture addressable sectors, including unallocated space and slack space when the acquisition method and source allow it. A logical collection copies selected files and may omit deleted data, metadata, alternate streams or inaccessible areas. Neither method is universally superior: select according to the investigation question, authority, device state, encryption, storage health and time constraints. Record the tool and version, options, start/end times, errors, sectors or files acquired, image format and destination media.</p>
      <p>Hash the source and acquired image when the acquisition process permits, then compare and document the results. SHA-256 is commonly used to detect changes in an acquired image. A matching digest supports that the compared byte sequences match; it does not prove that the source was collected completely, that the device was already in a trustworthy state, or that the examination interpretation is correct. If a failing drive cannot be read fully, preserve the acquisition map and error log and clearly identify unreadable ranges instead of claiming a perfect copy.</p>
      <CodeBlock label="Hash an existing training image and record tool versions">{`sha256sum case01.dd
sha256sum case01.dd > case01.dd.sha256

# Record versions used for repeatability.
mmls -V
fls -V
icat -V

# In a real acquisition, document source identity, blocker, tool/options,
# start/end times, read errors, destination, and verification results.`}</CodeBlock>
      <Callout variant="warn"><p>Hashing a file after analysis does not make an unsafe acquisition defensible. Preserve the original source according to policy, work from a verified image or controlled copy, and record every transformation. Evidence handling and legal requirements vary by organization and jurisdiction.</p></Callout>

      <h2>Understand the layers inside a disk image</h2>
      <p>A whole-disk image may contain a partition table followed by one or more partitions. A partition contains a file system, and the file system organizes names, metadata and data into structures. The Sleuth Kit separates these layers: <code>mmls</code> reports the volume layout, <code>fsstat</code> describes a file system, <code>fls</code> lists names, <code>istat</code> inspects metadata, and <code>icat</code> reads a file by its metadata address. This layered model explains why a command can fail when given the wrong image, file-system type, sector offset or identifier.
      </p>
      <CodeBlock label="Find the partition start before inspecting its file system">{`# First inspect the partition map.
mmls case01.dd

# Example only: suppose your own mmls output shows the target partition
# begins at sector 2048. Use that observed offset, not this sample value.
fsstat -o 2048 case01.dd
fls -r -o 2048 case01.dd | head -n 40

# Look for deleted directory entries in the same file system.
fls -r -d -o 2048 case01.dd`}</CodeBlock>
      <p>The offset supplied to Sleuth Kit is normally the partition's starting sector, as reported by the image layout and using the correct sector-size assumptions. Some images contain a file-system partition directly and need no offset; others are split images or use a non-default sector size. Preserve the complete <code>mmls</code> output in notes and verify the chosen partition with <code>fsstat</code>. An incorrect offset can produce confusing errors or apparently plausible but unrelated results.</p>

      <h2>What deletion means—and why recovery is uncertain</h2>
      <p>Most file systems separate a file's name, metadata and content blocks. Deletion commonly marks some of those structures as reusable rather than overwriting every content byte immediately. Recovery may be possible while the relevant metadata and data remain intact, but the outcome depends on the file system, subsequent writes, journaling, encryption, storage-controller behavior and device type. A deleted name might remain while its content is overwritten; content might remain while its original name and path are gone; metadata can also be reused or reorganized.</p>
      <p>On NTFS, the Master File Table stores file records and attributes. A record can include standard-information timestamps, one or more file-name attributes, security metadata and data. Small files may use a resident data attribute stored within the record; larger files normally refer to clusters elsewhere. A file can have long and short names, and directory indexes may be updated in ways that make deleted names unavailable or duplicate-looking. NTFS is one file system, not a model for every disk: ext4 uses inodes and directory entries; APFS uses copy-on-write structures and snapshots; other formats have different metadata and recovery behavior.</p>
      <p>NTFS commonly exposes four timestamps associated with different metadata attributes. The familiar “MACB” shorthand is a mnemonic, not a guarantee that timestamps represent human actions accurately. Access-time updates can be disabled, delayed or coalesced; copying, restoration, clock changes and application behavior can affect timestamps. Convert times with the original system's timezone and clock context, and corroborate a timeline with independent artifacts. A timestamp says what the file-system structure recorded, not who was physically at the keyboard.</p>
      <CodeBlock label="List names, inspect a selected record, and extract only to an analysis destination">{`# In fls output, note the metadata address shown for a relevant entry.
fls -r -d -p -o 2048 case01.dd

# Replace META_ADDRESS with an address observed in your own output.
istat -o 2048 case01.dd META_ADDRESS

# Extract to a separate working directory, never over the evidence image.
icat -r -o 2048 case01.dd META_ADDRESS > recovered.bin
sha256sum recovered.bin`}</CodeBlock>
      <p><code>fls</code> may identify deleted names whose metadata survives, but it cannot promise recovery of every deletion. <code>icat</code> accepts a metadata address, not a filename; the address and partition offset must come from the examined image. The <code>-r</code> option requests recovery techniques for deleted content when supported. Preserve the original output, record the exact command and hash the extracted derivative. Validate the recovered file type and content; a successful extraction may still contain partial, overwritten, sparse or unrelated bytes.</p>

      <h2>File carving works without a usable file-system name</h2>
      <p>Carving searches unallocated or raw data for file-format patterns such as headers, internal structures and sometimes footers. A header can help locate a candidate, but many formats lack a reliable footer, may be fragmented across non-contiguous blocks, or can contain the same byte patterns inside unrelated data. Carvers may produce incomplete files, false positives, duplicate fragments or a file with no original name, path, timestamps or ownership information. Treat a carved result as a candidate artifact and validate it using file-format parsers, internal metadata, neighboring evidence and hashes where known.</p>
      <CodeBlock label="Carve a copy into a separate output folder">{`# Run only on the authorized lab image; output goes to analysis storage.
foremost -i case01.dd -o case01-carved

# Review the tool's audit report, file types, sizes and extraction errors.
# Do not infer original path or user from a carved filename.`}</CodeBlock>
      <p>Carving is not always a “last resort.” It can complement file-system analysis when names or metadata are missing, but its results are weaker in context. SSD TRIM, encryption, compression, file-system snapshots, overwritten clusters and acquisition errors all change what is recoverable. On encrypted media, a raw image may contain ciphertext that cannot be interpreted without the authorized key or unlocked logical collection. Never promise a recovery rate based only on the fact that a file was deleted.</p>

      <h2>Build an Autopsy case and review its ingest results</h2>
      <p>Autopsy provides case management and a graphical workflow over The Sleuth Kit and other ingest modules. Create a case with a stable identifier and timezone, add the supplied disk image as a data source, select ingest modules appropriate to the question, and record which modules ran. Typical workflows can include file-system analysis, hash lookup, keyword search, file-type identification and timeline generation. Each module has limits and can generate false positives; review the underlying file, metadata and tool output before making a finding.</p>
      <p>Start with image metadata and partition layout, then review allocated files and deleted entries, search narrowly chosen terms, inspect relevant artifacts and build a timeline. Save bookmarks and notes with the reason an item matters. Export reports to a separate case output location and preserve the case database and module configuration. For large images, ingest can take significant time and may fail partially; check ingest status and errors rather than assuming that an opened case has processed every item.</p>
      <Callout variant="tip"><p>Use the same validation habit in the GUI and command line: identify the data source, confirm its hash and partitions, note the module or command used, inspect the result, and record limitations. A colorful Autopsy result pane is an index to evidence, not a substitute for explaining how the evidence supports a conclusion.</p></Callout>

      <h2>Write findings that another examiner can reproduce</h2>
      <p>A useful disk-forensics note includes the question, data source and image hash, tool/version, relevant command or Autopsy module, partition offset, metadata address or file path, timestamp interpretation, artifact hash and a concise explanation of the result. Separate direct observations from inference. For example: “The image contains a deleted directory entry named <code>report.csv</code> at metadata address 4127” is an observation; “the former user deleted it to hide an intrusion” is an inference that requires corroborating evidence. Note unreadable sectors, encrypted content, missing event coverage and other constraints.</p>
      <p>When comparing two hypotheses, ask what evidence each predicts. If a file was deleted during normal cleanup, nearby log rotation artifacts and expected scheduled jobs may support that explanation. If deliberate concealment is suspected, look for independent evidence such as process execution, authentication events, remote copies or policy violations. Avoid claiming that a file's presence proves it was opened, or that its absence proves it never existed.</p>

      <h2>References and tool documentation</h2>
      <p>Use the current local tool help because command options can vary by installed version. The official <a href="https://www.sleuthkit.org/sleuthkit/man/mmls.html" target="_blank" rel="noreferrer">mmls manual</a>, <a href="https://www.sleuthkit.org/sleuthkit/man/fls.html" target="_blank" rel="noreferrer">fls manual</a> and <a href="https://sleuthkit.org/sleuthkit/man/icat.html" target="_blank" rel="noreferrer">icat manual</a> explain image offsets, deleted-name listing and metadata-address extraction. NIST's <a href="https://csrc.nist.gov/pubs/sp/800/86/final" target="_blank" rel="noreferrer">SP 800-86</a> introduces forensic techniques in incident response; use current organizational policy and qualified legal guidance for real evidence handling.</p>
    </div>
  );
}
