BEGIN;
SET ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"user_storage_test","role":"authenticated"}', true);

INSERT INTO storage.objects(bucket_id,name) VALUES ('feedback_images','user_storage_test/image.png');
DO $$ BEGIN
  BEGIN
    INSERT INTO storage.objects(bucket_id,name) VALUES ('feedback_images','another_user/image.png');
    RAISE EXCEPTION 'Cross-account upload unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO storage.objects(bucket_id,name) VALUES ('another_bucket','user_storage_test/image.png');
    RAISE EXCEPTION 'Unrelated bucket upload unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

RESET ROLE;
INSERT INTO storage.objects(bucket_id,name) VALUES ('feedback_images','another_user/image.png');
SET ROLE authenticated;
DELETE FROM storage.objects WHERE name = 'another_user/image.png';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE name = 'another_user/image.png') THEN
    RAISE EXCEPTION 'Cross-account image deletion unexpectedly succeeded';
  END IF;
END $$;
DELETE FROM storage.objects WHERE name = 'user_storage_test/image.png';
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM storage.objects WHERE name = 'user_storage_test/image.png') THEN
    RAISE EXCEPTION 'Own image deletion failed';
  END IF;
END $$;

SET ROLE anon;
DO $$ BEGIN
  BEGIN
    INSERT INTO storage.objects(bucket_id,name) VALUES ('feedback_images','user_storage_test/anon.png');
    RAISE EXCEPTION 'Anonymous upload unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'Clerk storage ownership and anonymous upload denial passed' AS result;
