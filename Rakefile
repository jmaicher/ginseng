task :build => :jshint do
  # check if node is available
  which "node" or fail "node could not be found on your $PATH."
 
  puts "Building ginseng with r.js ...\n\n" 
  # create build with r.js using the build.js config
  sh "node vendor/r.js -o build.js"
  puts "Building minified version ...\n\n"
  sh "node vendor/r.js -o build-minified.js"
end

task :jshint do
  # check if jshint is available
  which "jshint" or fail "jshint could not be found on your $PATH. You can install jshint with npm: npm install -g jshint"
  src_dir = "lib/"
  puts "Running jshint against #{src_dir} ...\n\n"

  sh "jshint #{src_dir}" do |ok, res|
    unless ok
      fail "jshint test failed with errors listed above!\n\n"
      puts res
    end
  end

  puts "jshint passed without errors!\n\n"
end

task :doc do
  which "jsdoc" or fail "jsdoc could not be found on your $PATH"

  src_dir = "lib/"
  target_dir = "doc/"

  puts "Creating documentation from #{src_dir} ...\n\n"
  sh "jsdoc -d #{target_dir} -r #{src_dir}"

  puts "\nDocumentation has been created in #{target_dir}"
end


####################
## Helpers #########
####################

def which(cmd)
  exts = ENV['PATHEXT'] ? ENV['PATHEXT'].split(';') : ['']
  ENV['PATH'].split(File::PATH_SEPARATOR).each do |path|
    exts.each do |ext|
      exe = "#{path}/#{cmd}#{ext}"
      return exe if File.executable? exe
    end
  end
  return nil
end
