import importlib.util
from pathlib import Path
import subprocess
import unittest
import base64

ROOT=Path(__file__).resolve().parents[1]
SPEC=importlib.util.spec_from_file_location('savekey',ROOT/'scripts/save-waffo-private-key.py')
assert SPEC is not None and SPEC.loader is not None
key=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(key)

class PublicPasteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.private=subprocess.check_output(['openssl','genpkey','-algorithm','RSA','-pkeyopt','rsa_keygen_bits:2048'],stderr=subprocess.DEVNULL)
        cls.public=subprocess.check_output(['openssl','rsa','-pubout'],input=cls.private,stderr=subprocess.DEVNULL).decode()
    def test_full_multiline(self): key.normalize_public(self.public)
    def test_base64_body(self): key.normalize_public(''.join(self.public.splitlines()[1:-1]))
    def test_base64_of_entire_pem(self): key.normalize_public(base64.b64encode(self.public.encode()).decode())
    def test_quoted_escaped_pem(self): key.normalize_public('"'+self.public.replace('\n','\\n')+'"')
    def test_bracketed_paste(self): key.normalize_public('\x1b[200~'+self.public+'\x1b[201~')
    def test_private_rejected_with_safe_code(self):
        with self.assertRaisesRegex(ValueError,'WRONG_KEY_TYPE'): key.normalize_public(self.private.decode())
    def test_empty_is_diagnostic(self):
        with self.assertRaisesRegex(ValueError,'EMPTY_PUBLIC_KEY'): key.normalize_public('')

    def tty_run(self,value,expected):
        import os,pty,select,tempfile,time
        with tempfile.TemporaryDirectory() as home:
            directory=Path(home)/'.config/ai-coloring-page-generator/keys'
            directory.mkdir(parents=True)
            private=directory/'waffo-test-private.pem'
            private.write_bytes(self.private)
            master,slave=pty.openpty()
            process=subprocess.Popen(['python3',str(ROOT/'scripts/save-waffo-private-key.py'),'--public'],stdin=slave,stdout=slave,stderr=slave,env={**os.environ,'HOME':home})
            os.close(slave)
            output=b''
            deadline=time.monotonic()+10
            try:
                while b'Input is hidden.' not in output:
                    self.assertLess(time.monotonic(),deadline)
                    if select.select([master],[],[],0.1)[0]: output+=os.read(master,65536)
                os.write(master,value.encode()+b'\n\n')
                while True:
                    self.assertLess(time.monotonic(),deadline)
                    if select.select([master],[],[],0.1)[0]:
                        try: chunk=os.read(master,65536)
                        except OSError: break
                        if not chunk: break
                        output+=chunk
                process.wait(timeout=2)
                self.assertIn(expected.encode(),output)
                self.assertNotIn(self.public.splitlines()[1].encode(),output)
                self.assertEqual(private.read_bytes(),self.private)
                if expected.startswith('PASS'):
                    self.assertEqual(process.returncode,0)
                    public=directory/'waffo-test-webhook-public.pem'
                    self.assertEqual(public.stat().st_mode & 0o777,0o600)
                else:
                    self.assertNotEqual(process.returncode,0)
                    self.assertFalse((directory/'waffo-test-webhook-public.pem').exists())
            finally:
                if process.poll() is None: process.kill(); process.wait()
                os.close(master)
    def test_real_tty_multiline_without_echo(self): self.tty_run(self.public,'PASS: RSA public key parsed')
    def test_real_tty_invalid_has_safe_diagnostic(self): self.tty_run('not-a-public-key','STOP: PUBLIC_KEY_FORMAT_INVALID')
    def test_real_tty_single_line(self): self.tty_run(''.join(self.public.splitlines()[1:-1]),'PASS: RSA public key parsed')

if __name__=='__main__': unittest.main()
