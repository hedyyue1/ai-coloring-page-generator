import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('installer', ROOT / 'scripts/install-waffo-test.py')
assert SPEC and SPEC.loader
installer = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(installer)


class InstallerTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.root = Path(self.directory.name)
        installer.run(['openssl','genpkey','-algorithm','RSA','-pkeyopt','rsa_keygen_bits:2048','-out',str(self.root/'private.pem')])
        installer.run(['openssl','pkey','-in',str(self.root/'private.pem'),'-pubout','-out',str(self.root/'public.pem')])
        self.bundle = {'project':installer.WORKER, 'mode':'test', 'vars':{
            'WAFFO_MERCHANT_ID':'MER_fixture','WAFFO_STORE_ID_TEST':'STO_fixture',
            'WAFFO_PRODUCT_STARTER_TEST':'PROD_starter','WAFFO_PRODUCT_STANDARD_TEST':'PROD_standard','WAFFO_PRODUCT_PREMIUM_TEST':'PROD_premium'},
            'secrets':{'WAFFO_PRIVATE_KEY_TEST':(self.root/'private.pem').read_text(),'WAFFO_WEBHOOK_PUBLIC_KEY_TEST':(self.root/'public.pem').read_text()}}

    def tearDown(self):
        self.directory.cleanup()

    def test_local_rsa_fixture_validates(self):
        installer.validate_bundle(self.bundle)

    def test_other_project_and_live_are_rejected(self):
        for field,value in [('project','another-project'),('mode','live')]:
            bundle={**self.bundle,field:value}
            with self.assertRaises(ValueError):
                installer.validate_bundle(bundle)

    def test_duplicate_products_rejected(self):
        self.bundle['vars']['WAFFO_PRODUCT_STANDARD_TEST']='PROD_starter'
        with self.assertRaises(ValueError):
            installer.validate_bundle(self.bundle)

    def test_ec_key_is_rejected_before_remote_writes(self):
        installer.run(['openssl','genpkey','-algorithm','EC','-pkeyopt','ec_paramgen_curve:P-256','-out',str(self.root/'ec.pem')])
        self.bundle['secrets']['WAFFO_PRIVATE_KEY_TEST']=(self.root/'ec.pem').read_text()
        with self.assertRaises(RuntimeError):
            installer.validate_bundle(self.bundle)

    def test_missing_key_path_retries_without_reasking_ids(self):
        from unittest.mock import patch
        path=self.root/'private.pem'
        path.chmod(0o600)
        with patch.object(installer.getpass,'getpass',side_effect=[str(self.root/'missing.pem'),str(path)]), patch('builtins.print'):
            self.assertEqual(installer.ask_key_path('key path: '),path)

    def test_pending_checkpoint_reuses_all_ids(self):
        from unittest.mock import patch
        directory=self.root/'.config'/installer.WORKER
        directory.mkdir(parents=True,mode=0o700)
        pending=directory/'waffo-test.pending.json'
        pending.write_text(json.dumps({k:self.bundle[k] for k in ('project','mode','vars')}))
        pending.chmod(0o600)
        for name in ('private.pem','public.pem'): (self.root/name).chmod(0o600)
        with patch.object(installer.Path,'home',return_value=self.root), patch.object(installer.getpass,'getpass',side_effect=[str(self.root/'private.pem'),str(self.root/'public.pem')]) as prompts:
            result=installer.get_bundle()
        self.assertEqual(prompts.call_count,2)
        self.assertEqual(result['vars']['WAFFO_MERCHANT_ID'],'MER_fixture')
        self.assertEqual((directory/'waffo-test.local.json').stat().st_mode & 0o777,0o600)

    def test_public_probe_declares_user_agent_and_is_read_only(self):
        from unittest.mock import patch
        from io import BytesIO
        fixture={'payments':{'provider':'waffo','mode':'test','configured':True}}
        def response(request,timeout):
            self.assertIsInstance(request,installer.urllib.request.Request)
            self.assertEqual(request.full_url,installer.SITE+'/api/config/public')
            self.assertTrue(request.get_header('User-agent'))
            self.assertEqual(request.get_method(),'GET')
            return BytesIO(json.dumps(fixture).encode())
        with patch.object(installer.urllib.request,'urlopen',side_effect=response):
            installer.probe_public()

    def test_permissions_and_symlinks_rejected(self):
        path=self.root/'credentials.json'
        path.write_text('{}')
        path.chmod(0o644)
        with self.assertRaises(ValueError): installer.PREP.protected_file(path)
        path.chmod(0o600)
        self.assertEqual(installer.PREP.protected_file(path),path)
        link=self.root/'link'; link.symlink_to(path)
        with self.assertRaises(ValueError): installer.PREP.protected_file(link)


if __name__=='__main__': unittest.main()
